const SLACK_API = "https://slack.com/api";

type SlackOk = { ok: true } & Record<string, unknown>;
type SlackErr = { ok: false; error: string };

async function slack<T extends SlackOk>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not set.");
  }

  const payloadBody = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== ""),
  );

  const response = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payloadBody),
  });

  const payload = (await response.json()) as T | SlackErr;
  if (!payload.ok) {
    throw new Error(payload.error || `Slack ${method} failed.`);
  }
  return payload;
}

export type SlackMember = {
  id: string;
  name: string;
  deleted?: boolean;
  is_bot?: boolean;
  is_app_user?: boolean;
  real_name?: string;
  profile?: {
    email?: string;
    real_name?: string;
    display_name?: string;
  };
};

function isHuman(member: SlackMember) {
  if (!member.id || member.deleted || member.is_bot || member.is_app_user) {
    return false;
  }
  if (member.id === "USLACKBOT") {
    return false;
  }
  return true;
}

function emailsMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export async function listHumans(): Promise<SlackMember[]> {
  const people: SlackMember[] = [];
  let cursor: string | undefined;

  do {
    const page = await slack<
      SlackOk & { members?: SlackMember[]; response_metadata?: { next_cursor?: string } }
    >("users.list", {
      limit: 200,
      cursor,
    });
    for (const member of page.members ?? []) {
      if (isHuman(member)) {
        people.push(member);
      }
    }
    cursor = page.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return people;
}

export async function resolveBirthdayPerson(
  exclude: string,
): Promise<SlackMember> {
  const needle = exclude.trim();
  if (!needle) {
    throw new Error("Say who the birthday person is on Slack.");
  }

  if (/^U[A-Z0-9]{8,}$/i.test(needle)) {
    const people = await listHumans();
    const found = people.find((person) => person.id === needle);
    if (!found) {
      throw new Error("That Slack member ID is not in this workspace.");
    }
    return found;
  }

  if (needle.includes("@")) {
    try {
      const looked = await slack<SlackOk & { user: SlackMember }>(
        "users.lookupByEmail",
        { email: needle },
      );
      if (looked.user && isHuman(looked.user)) {
        return looked.user;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message !== "users_not_found") {
        throw error;
      }
    }

    const people = await listHumans();
    const found = people.find((person) =>
      person.profile?.email
        ? emailsMatch(person.profile.email, needle)
        : false,
    );
    if (found) {
      return found;
    }
    throw new Error(
      "No Slack account uses that email. Try their member ID instead (it starts with U).",
    );
  }

  throw new Error("Use their Slack email or a member ID that starts with U.");
}

async function mapPool<T>(
  items: T[],
  width: number,
  work: (item: T) => Promise<void>,
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(width, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          await work(item);
        }
      }
    }),
  );
}

export function signingUrl(contributeToken: string) {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://manna-birthday-card.vercel.app");
  return `${raw.replace(/\/$/, "")}/sign/${contributeToken}`;
}

export function birthdayNudgeText(recipientName: string, url: string) {
  return [
    `We're putting together a birthday card for ${recipientName}.`,
    `Add a note here — they won't see this message, and they won't see anyone else's until the card is handed over.`,
    url,
  ].join("\n\n");
}

export async function messageEveryoneExcept(options: {
  birthday: SlackMember;
  text: string;
}): Promise<{ sent: number; skippedName: string; failed: string[] }> {
  const people = await listHumans();
  const targets = people.filter((person) => person.id !== options.birthday.id);
  const failed: string[] = [];

  await mapPool(targets, 6, async (person) => {
    try {
      const opened = await slack<SlackOk & { channel: { id: string } }>(
        "conversations.open",
        { users: person.id },
      );
      await slack("chat.postMessage", {
        channel: opened.channel.id,
        text: options.text,
        unfurl_links: false,
      });
    } catch (error) {
      const label =
        person.profile?.display_name ||
        person.real_name ||
        person.name ||
        person.id;
      failed.push(
        `${label}: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  });

  return {
    sent: targets.length - failed.length,
    skippedName:
      options.birthday.profile?.real_name ||
      options.birthday.real_name ||
      options.birthday.name,
    failed,
  };
}
