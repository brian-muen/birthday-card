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
  if (!profile) {
    fail("Google did not share a verified email.");
  }

  const organizerId = await upsertOrganizerFromGoogle(
    profile.googleSub,
    profile.email,
  );
  redirect(await finishOrganizerLogin(organizerId, start.next));
}
