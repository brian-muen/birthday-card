import Link from "next/link";
import { redirect } from "next/navigation";

import { organizerMenus } from "@/components/mail/compose-menus";
import { MailIcon } from "@/components/mail/outbox-icons";
import Computer from "@/components/os/computer";
import OsWindow from "@/components/os/os-window";
import { DesktopIcon, PixelIcon } from "@/components/os/pixel-icon";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { safeNextPath } from "@/lib/safe-next-path";
import "@/app/signin.css";

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
    <Computer menus={organizerMenus({ signedIn: false, next: nextPath })}>
      <OsWindow title="Sign in" width="27rem" className="signin" draggable closeHref="/" closeLabel="Close sign in">
        <div className="signin-body">
          <PixelIcon name="person" className="signin-icon" />
          <div className="signin-copy">
            <h1>Keep the cards you start</h1>
            <p>
              Anyone can make a card without signing in. Google just keeps your
              cards in Sent, so a lost organizer link isn’t the end of it.
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

      <div className="os-icons">
        <DesktopIcon icon="compose" label="New card" href="/" />
      </div>
    </Computer>
  );
}
