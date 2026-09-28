import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OrganizerIcons } from "@/components/mail/organizer-icons";
import { MailIcon } from "@/components/mail/outbox-icons";
import Computer from "@/components/os/computer";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { safeNextPath } from "@/lib/safe-next-path";
import "@/app/signin.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextPath = safeNextPath(next);
  if (await getCurrentOrganizer()) {
    redirect(nextPath);
  }

  return (
    <Computer
      icons={<OrganizerIcons signedIn={false} next={nextPath} current="sign-in" />}
    >
      <OsWindow title="Sign in" width="27rem" className="signin" draggable closeHref="/" closeLabel="Close sign in">
        <div className="signin-body">
          <PixelIcon name="person" className="signin-icon" />
          <div className="signin-copy">
            <h1>Sign in to start a card</h1>
            <p>
              Every card you start is kept in Sent, so its links are never lost.
              People signing and the birthday person never need an account.
            </p>
          </div>
        </div>
        {error ? (
          <div className="signin-error">
            <MailIcon name="alert" className="signin-error-icon" />
            <p role="alert">{error}</p>
          </div>
        ) : null}
        <form action="/api/auth/google" method="get" className="signin-actions">
          <input type="hidden" name="next" value={nextPath} />
          <Link href="/" className="os-button" data-variant="quiet">
            Not now
          </Link>
          <button type="submit" className="os-button">
            Continue with Google
          </button>
        </form>
      </OsWindow>
    </Computer>
  );
}
