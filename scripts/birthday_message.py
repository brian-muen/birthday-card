#!/usr/bin/env python3
"""Write the birthday nudge for a card, then copy it or DM it on Slack.

Copy the message to the clipboard:

    python3 scripts/birthday_message.py Sarah 2026-10-03 https://…/sign/abc

DM it to everyone in the Slack workspace except the birthday person, given
their Slack email or member ID (it asks before sending):

    python3 scripts/birthday_message.py Sarah 2026-10-03 https://…/sign/abc \\
        --except sarah@example.com

Add --dry-run to list who would get it without sending anything. Leave out
the name, date, and link to be asked for each. Sending reads SLACK_BOT_TOKEN
from the environment or from .env.local; the bot needs chat:write, im:write,
users:read, and users:read.email.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

TEMPLATE = (
    "{day} is {name}'s birthday! Here's the link to a digital card, feel free "
    "to write a message. Please fill this out, thank you!\n\n{link}"
)

SLACK_API = "https://slack.com/api"
ENV_FILE = Path(__file__).resolve().parent.parent / ".env.local"
SEND_WIDTH = 6


def ask(prompt: str) -> str:
    value = input(prompt).strip()
    if not value:
        sys.exit(f"Missing {prompt.strip(': ').lower()}.")
    return value


def parse_day(raw: str) -> str:
    try:
        day = date.fromisoformat(raw)
    except ValueError:
        sys.exit(f"Use a date like 2026-10-03, not {raw!r}.")
    return f"{day:%B} {day.day}"


def copy(text: str) -> bool:
    for command in (["pbcopy"], ["wl-copy"], ["xclip", "-selection", "clipboard"]):
        if shutil.which(command[0]):
            subprocess.run(command, input=text.encode(), check=True)
            return True
    return False


# ---------- Slack ----------


def bot_token() -> str:
    token = os.environ.get("SLACK_BOT_TOKEN", "")
    if not token and ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            match = re.match(r"\s*SLACK_BOT_TOKEN\s*=\s*(.*)", line)
            if match:
                token = match.group(1).strip().strip("'\"")
    if not token:
        sys.exit("Set SLACK_BOT_TOKEN in the environment or in .env.local.")
    return token


class SlackError(Exception):
    pass


def slack(token: str, method: str, **params: object) -> dict:
    body = urllib.parse.urlencode(
        {key: str(value) for key, value in params.items() if value not in (None, "")}
    ).encode()
    request = urllib.request.Request(
        f"{SLACK_API}/{method}",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    for _ in range(5):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 429:
                time.sleep(int(error.headers.get("Retry-After", "1")))
                continue
            raise SlackError(f"{method}: HTTP {error.code}") from error
        if payload.get("ok"):
            return payload
        extra = ", ".join(
            part
            for part in (
                payload.get("needed") and f"needed {payload['needed']}",
                payload.get("provided") and f"had {payload['provided']}",
            )
            if part
        )
        reason = payload.get("error", "failed")
        raise SlackError(f"{method}: {reason}" + (f" ({extra})" if extra else ""))
    raise SlackError(f"{method}: still rate limited after 5 tries")


def is_human(member: dict) -> bool:
    return bool(
        member.get("id")
        and member["id"] != "USLACKBOT"
        and not member.get("deleted")
        and not member.get("is_bot")
        and not member.get("is_app_user")
    )


def label(member: dict) -> str:
    profile = member.get("profile") or {}
    return (
        profile.get("real_name")
        or member.get("real_name")
        or profile.get("display_name")
        or member.get("name")
        or member["id"]
    )


def list_humans(token: str) -> list[dict]:
    people, cursor = [], None
    while True:
        page = slack(token, "users.list", limit=200, cursor=cursor)
        people += [member for member in page.get("members", []) if is_human(member)]
        cursor = (page.get("response_metadata") or {}).get("next_cursor")
        if not cursor:
            return people


def find_birthday_person(people: list[dict], needle: str) -> dict:
    needle = needle.strip()
    if re.fullmatch(r"U[A-Z0-9]{8,}", needle, re.IGNORECASE):
        found = [person for person in people if person["id"].upper() == needle.upper()]
        if not found:
            sys.exit("That Slack member ID is not in this workspace.")
        return found[0]
    if "@" in needle:
        found = [
            person
            for person in people
            if (person.get("profile") or {}).get("email", "").lower() == needle.lower()
        ]
        if not found:
            sys.exit(
                "No Slack account uses that email. Try their member ID "
                "instead (it starts with U)."
            )
        return found[0]
    sys.exit("Use their Slack email or a member ID that starts with U.")


def dm(token: str, person: dict, text: str) -> None:
    opened = slack(token, "conversations.open", users=person["id"])
    channel = opened["channel"]
    channel_id = channel["id"] if isinstance(channel, dict) else channel
    slack(token, "chat.postMessage", channel=channel_id, text=text, unfurl_links="false")


def send_to_everyone_except(message: str, exclude: str, dry_run: bool) -> None:
    token = bot_token()
    try:
        people = list_humans(token)
    except SlackError as error:
        sys.exit(f"Slack {error}")
    birthday = find_birthday_person(people, exclude)
    targets = sorted(
        (person for person in people if person["id"] != birthday["id"]), key=label
    )

    print(f"\nSkipping {label(birthday)}. {len(targets)} people would get this DM:")
    for person in targets:
        print(f"  • {label(person)}")
    if dry_run or not targets:
        return
    if input(f"\nSend it to all {len(targets)}? Type yes to send: ").strip().lower() != "yes":
        print("Nothing sent.")
        return

    def attempt(person: dict) -> tuple[dict, str | None]:
        try:
            dm(token, person, message)
            return person, None
        except SlackError as error:
            return person, str(error)

    with ThreadPoolExecutor(max_workers=SEND_WIDTH) as pool:
        results = list(pool.map(attempt, targets))

    failed = [(person, error) for person, error in results if error]
    print(f"\nMessaged {len(targets) - len(failed)} of {len(targets)}. Skipped {label(birthday)}.")
    if failed:
        print("Did not go through:")
        for person, error in failed:
            print(f"  • {label(person)}: {error}")


# ---------- Main ----------


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("name", nargs="?")
    parser.add_argument("birthday", nargs="?", help="YYYY-MM-DD")
    parser.add_argument("link", nargs="?", help="the card's signing link")
    parser.add_argument(
        "--except",
        dest="exclude",
        metavar="EMAIL_OR_ID",
        help="DM everyone in Slack except this person",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="list who would get the DM, send nothing"
    )
    args = parser.parse_args()

    given = [args.name, args.birthday, args.link]
    if any(given) and not all(given):
        parser.error("give the name, birthday, and link together, or none of them")
    if args.dry_run and not args.exclude:
        parser.error("--dry-run needs --except")

    name = args.name or ask("Name: ")
    raw_day = args.birthday or ask("Birthday (YYYY-MM-DD): ")
    link = args.link or ask("Signing link: ")
    message = TEMPLATE.format(day=parse_day(raw_day), name=name, link=link)
    print(message)

    if args.exclude:
        send_to_everyone_except(message, args.exclude, args.dry_run)
    elif copy(message):
        print("\nCopied to the clipboard.", file=sys.stderr)


if __name__ == "__main__":
    main()
