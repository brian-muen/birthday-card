import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentOrganizer } from "@/lib/organizer-auth";
import {
  GOOGLE_OAUTH_COOKIE,
  appOrigin,
  encodeGoogleOAuthStart,
  googleAuthorizationUrl,
  googleOAuthConfigured,
  googleOAuthCookieOptions,
  newGoogleOAuthStart,
} from "@/lib/google-oauth";
import { safeNextPath } from "@/lib/safe-next-path";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (await getCurrentOrganizer()) {
    return NextResponse.redirect(new URL(next, appOrigin(request)));
  }
  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/account?error=Google%20sign-in%20is%20not%20configured.", appOrigin(request)),
    );
  }

  const origin = appOrigin(request);
  const start = newGoogleOAuthStart(next);
  const response = NextResponse.redirect(googleAuthorizationUrl(origin, start));
  response.cookies.set(
    GOOGLE_OAUTH_COOKIE,
    encodeGoogleOAuthStart(start),
    googleOAuthCookieOptions(origin.startsWith("https://")),
  );
  return response;
}
