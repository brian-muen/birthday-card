import { timingSafeEqual } from "node:crypto";

export function notifyPasswordAccepted(given: string) {
  const expected = process.env.SLACK_NOTIFY_PASSWORD ?? "";
  if (!expected) {
    return false;
  }

  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
