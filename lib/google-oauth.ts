import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { parseEmail } from "./email";
import { safeNextPath } from "./safe-next-path";

export const GOOGLE_OAUTH_COOKIE = "organizer_oauth";
const OAUTH_MAX_AGE_SECONDS = 60 * 10;

export type GoogleOAuthStart = {
  state: string;
  verifier: string;
  next: string;
};

export function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function appOrigin(request: Request): string {
  const fromEnv = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return new URL(request.url).origin;
}

export function googleCallbackUrl(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function newGoogleOAuthStart(nextRaw: unknown): GoogleOAuthStart {
  return {
    state: randomBytes(16).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    next: safeNextPath(nextRaw),
  };
}

export function encodeGoogleOAuthStart(start: GoogleOAuthStart) {
  return JSON.stringify(start);
}

export function parseGoogleOAuthStart(raw: string | undefined): GoogleOAuthStart | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleOAuthStart>;
    if (
      typeof parsed.state !== "string" ||
      typeof parsed.verifier !== "string" ||
      typeof parsed.next !== "string"
    ) {
      return null;
    }
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      next: safeNextPath(parsed.next),
    };
  } catch {
    return null;
  }
}

export function googleOAuthCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  };
}

export function googleAuthorizationUrl(origin: string, start: GoogleOAuthStart) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleCallbackUrl(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", start.state);
  url.searchParams.set("code_challenge", sha256Base64Url(start.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url;
}

export function sameOAuthState(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function googleProfileFromCode(origin: string, code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: googleCallbackUrl(origin),
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) return null;
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) return null;

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResponse.ok) return null;
  const user = (await userResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };
  const email = user.email_verified ? parseEmail(user.email) : null;
  if (!user.sub || !email) return null;
  return { googleSub: user.sub, email };
}

function sha256Base64Url(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}
