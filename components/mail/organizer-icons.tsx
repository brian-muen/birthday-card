import type { ReactNode } from "react";

import { logOut } from "@/app/actions/organizer-auth";
import { DesktopIcon } from "@/components/os/pixel-icon";

export function signInHref(next?: string) {
  return next ? `/account?next=${encodeURIComponent(next)}` : "/account";
}

/**
 * The desktop icons every organizer page shares; `next` is where sign-in
 * returns to. `children` are the page's own app icons and go first; the
 * `current` page's app is one of them, so it isn't linked again.
 */
export function OrganizerIcons({
  signedIn,
  next,
  current,
  children,
}: {
  signedIn: boolean;
  next?: string;
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
      ) : current === "sign-in" ? null : (
        <DesktopIcon icon="person" label="Sign in" href={signInHref(next)} />
      )}
    </>
  );
}
