import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import {
  type GoogleIdentity,
  type GoogleProfile,
  profileFromGoogleIdentity,
} from "./email";
import { safeNextPath } from "./safe-next-path";

export const GOOGLE_OAUTH_COOKIE = "organizer_oauth";
const OAUTH_MAX_AGE_SECONDS = 60 * 10;

export type GoogleOAuthStart = {
  state: string;
  verifier: string;
  next: string;
};

export function googleOAuthConfigured() {
  return Boolean(googleClientId() && googleClientSecret());
}

function envText(name: string) {
  return process.env[name]?.trim() ?? "";
}

function googleClientId() {
  return envText("GOOGLE_CLIENT_ID");
}

function googleClientSecret() {
  return envText("GOOGLE_CLIENT_SECRET");
}

export function publicAppOrigin() {
  const fromEnv = envText("APP_URL") || envText("NEXT_PUBLIC_APP_URL");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = envText("VERCEL_PROJECT_PRODUCTION_URL").replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "https://manna-birthday-card.vercel.app";
}

export function requestOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
  const proto = (request.headers.get("x-forwarded-proto") || "https")
    .split(",")[0]
    .trim();
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function appOrigin(request: Request) {
  const incoming = requestOrigin(request);
  if (
    incoming.startsWith("http://localhost") ||
    incoming.startsWith("http://127.0.0.1")
  ) {
    return incoming;
  }
  return publicAppOrigin();
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
  url.searchParams.set("client_id", googleClientId());
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

function claimsFromIdToken(idToken: string | undefined): GoogleIdentity | null {
  if (!idToken) return null;
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as GoogleIdentity;
  } catch {
    return null;
  }
}

export async function googleProfileFromCode(
  origin: string,
  code: string,
  verifier: string,
): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
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
  if (!tokenResponse.ok) {
    return { ok: false, reason: await googleTokenFailure(tokenResponse) };
  }
  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!tokens.access_token && !tokens.id_token) {
    return { ok: false, reason: "token" };
  }

  const fromIdToken = claimsFromIdToken(tokens.id_token);
  let fromUserinfo: GoogleIdentity | null = null;
  if (tokens.access_token) {
    const userResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (userResponse.ok) {
      fromUserinfo = (await userResponse.json()) as GoogleIdentity;
    }
  }

  return profileFromGoogleIdentity({
    sub: fromUserinfo?.sub ?? fromIdToken?.sub,
    email: fromUserinfo?.email ?? fromIdToken?.email,
    email_verified: fromUserinfo?.email_verified ?? fromIdToken?.email_verified,
  });
}

function sha256Base64Url(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

async function googleTokenFailure(
  response: Response,
): Promise<"token" | "client" | "redirect" | "grant"> {
  try {
    const body = (await response.json()) as {
      error?: string;
      error_description?: string;
    };
    if (body.error === "invalid_client") return "client";
    if (body.error === "redirect_uri_mismatch") return "redirect";
    if (body.error === "invalid_grant") return "grant";
  } catch {
    // Google sometimes returns a non-JSON body; keep the generic token error.
  }
  return "token";
}
