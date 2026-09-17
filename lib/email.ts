const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > EMAIL_MAX) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}

export type GoogleIdentity = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
};

export type GoogleProfile =
  | { ok: true; googleSub: string; email: string }
  | { ok: false; reason: "token" | "profile" };

export function profileFromGoogleIdentity(user: GoogleIdentity): GoogleProfile {
  const email = parseEmail(user.email);
  if (!user.sub || !email) return { ok: false, reason: "profile" };
  return { ok: true, googleSub: user.sub, email };
}
