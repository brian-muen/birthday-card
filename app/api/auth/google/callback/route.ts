import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { finishOrganizerLogin } from "@/lib/organizer-auth";
import { upsertOrganizerFromGoogle } from "@/lib/organizer-google";
import {
  GOOGLE_OAUTH_COOKIE,
  googleOAuthCookieOptions,
  googleProfileFromCode,
  parseGoogleOAuthStart,
  sameOAuthState,
  appOrigin,
} from "@/lib/google-oauth";

async function clearOAuthCookie(origin: string) {
  (await cookies()).set(GOOGLE_OAUTH_COOKIE, "", {
    ...googleOAuthCookieOptions(origin.startsWith("https://")),
    maxAge: 0,
  });
}

function fail(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/account?${params.toString()}`);
}

function googleSignInFailure(
  reason: "token" | "profile" | "client" | "redirect" | "grant",
  origin: string,
) {
  if (reason === "client") {
    return "Google rejected the app credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel.";
  }
  if (reason === "redirect") {
    return `Google rejected the redirect URI. Add ${origin}/api/auth/google/callback in Google Cloud.`;
  }
  if (reason === "grant") {
    return "Google sign-in expired. Try again.";
  }
  if (reason === "profile") {
    return "Google did not share an email. In Google Cloud, add the Email scope, then try again.";
  }
  return "Could not finish Google sign-in. Try again.";
}

export async function GET(request: NextRequest) {
  const origin = appOrigin(request);
  const params = request.nextUrl.searchParams;
  const start = parseGoogleOAuthStart(
    (await cookies()).get(GOOGLE_OAUTH_COOKIE)?.value,
  );
  await clearOAuthCookie(origin);

  if (params.get("error") === "access_denied") {
    fail("Google sign-in was cancelled.");
  }
  if (!start) {
    fail("Google sign-in expired. Try again.");
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !sameOAuthState(state, start.state)) {
    fail("Could not verify the Google sign-in.");
  }

  const profile = await googleProfileFromCode(origin, code, start.verifier);
  if (!profile.ok) {
    fail(googleSignInFailure(profile.reason, origin));
  }

  const organizerId = await upsertOrganizerFromGoogle(
    profile.googleSub,
    profile.email,
  );
  redirect(await finishOrganizerLogin(organizerId, start.next));
}
