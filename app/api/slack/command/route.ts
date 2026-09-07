import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { notifyPasswordAccepted } from "@/lib/notify-password";
import {
  birthdayNudgeText,
  messageEveryoneExcept,
  resolveBirthdayPerson,
} from "@/lib/slack";

function verifiedSlackRequest(rawBody: string, request: Request) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  if (!secret || !timestamp || !signature) {
    return false;
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) {
    return false;
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${createHmac("sha256", secret).update(base).digest("hex")}`;
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseCommandText(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const exceptAt = parts.findIndex(
    (part) => part.toLowerCase() === "except" || part.toLowerCase() === "skip",
  );
  if (exceptAt >= 0 && parts[exceptAt + 1]) {
    const exclude = parts[exceptAt + 1].replace(/^<mailto:([^|>]+)\|?[^>]*>$/, "$1");
    const mention = parts[exceptAt + 1].match(/^<@([A-Z0-9]+)(?:\|[^>]+)?>$/i);
    const rest = [...parts.slice(0, exceptAt), ...parts.slice(exceptAt + 2)];
    const url = rest.find((part) => part.startsWith("http"));
    const leftover = rest.filter((part) => part !== url);
    const password = leftover.at(-1) || "";
    const name = leftover.slice(0, -1).join(" ") || "them";
    return {
      exclude: mention?.[1] || exclude,
      url,
      name,
      password,
    };
  }

  const mention = text.match(/<@([A-Z0-9]+)(?:\|[^>]+)?>/i);
  const email = text.match(/<mailto:([^|>]+)\|?[^>]*>/i)?.[1] || text.match(/\S+@\S+/)?.[0];
  const url = text.match(/https?:\/\/\S+/)?.[0];
  const leftover = text
    .trim()
    .split(/\s+/)
    .filter((part) => {
      if (part.startsWith("http")) return false;
      if (mention && part.includes(mention[1])) return false;
      if (email && part.includes(email)) return false;
      return true;
    });
  return {
    exclude: mention?.[1] || email || "",
    url,
    name: "them",
    password: leftover.at(-1) || "",
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifiedSlackRequest(rawBody, request)) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const parsed = parseCommandText(params.get("text") ?? "");

  if (!parsed.exclude || !parsed.url || !parsed.password) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Try `/card except @birthday https://manna-birthday-card.vercel.app/sign/… PASSWORD`",
    });
  }

  if (!notifyPasswordAccepted(parsed.password)) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "That password is wrong.",
    });
  }

  try {
    const birthday = await resolveBirthdayPerson(parsed.exclude);
    const result = await messageEveryoneExcept({
      birthday,
      text: birthdayNudgeText(parsed.name, parsed.url),
    });
    return NextResponse.json({
      response_type: "ephemeral",
      text: `Messaged ${result.sent} ${result.sent === 1 ? "person" : "people"}. Skipped ${result.skippedName}.${
        result.failed.length > 0
          ? ` ${result.failed.length} did not go through.`
          : ""
      }`,
    });
  } catch (error) {
    return NextResponse.json({
      response_type: "ephemeral",
      text:
        error instanceof Error
          ? error.message
          : "Slack could not send those messages.",
    });
  }
}
