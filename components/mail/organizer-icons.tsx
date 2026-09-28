import type { ReactNode } from "react";

import { logOut } from "@/app/actions/organizer-auth";
import { SignInWatch } from "@/components/mail/sign-in-watch";
import { AppIcon } from "@/components/os/desktop";
import { DesktopIcon } from "@/components/os/pixel-icon";

/**
 * The desktop icons every organizer page shares. `children` are the page's
 * own app icons and go first; the `current` page's app is one of them, so
 * it isn't linked again. Sign in opens the sign-in window on this desktop
 * (`SignInApp`); it does not leave the page.
 */
export function OrganizerIcons({
  signedIn,
  current,
  children,
}: {
  signedIn: boolean;
  current?: "new" | "sent" | "sign-in";
  children?: ReactNode;
}) {
  return (
    <>
      {children}
      {current === "new" ? null : <DesktopIcon icon="compose" label="New card" href="/" />}
      {signedIn ? (
        <>
          {current === "sent" ? null : <DesktopIcon icon="folder" label="Sent" href="/cards" />}
          <DesktopIcon icon="signout" label="Sign out" action={logOut} />
        </>
      ) : (
        <>
          <SignInWatch />
          {current === "sign-in" ? null : <AppIcon app="sign-in" icon="person" label="Sign in" />}
        </>
      )}
    </>
  );
}
