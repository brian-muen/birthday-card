import { logOut } from "@/app/actions/organizer-auth";
import { DesktopIcon } from "@/components/os/pixel-icon";

export function signInHref(next?: string) {
  return next ? `/account?next=${encodeURIComponent(next)}` : "/account";
}

/** The desktop icons every organizer page shares; `next` is where sign-in returns to. */
export function OrganizerIcons({
  signedIn,
  next,
  current,
}: {
  signedIn: boolean;
  next?: string;
  current?: "new" | "sent" | "sign-in";
}) {
  return (
    <>
      <DesktopIcon icon="compose" label="New card" href="/" current={current === "new"} />
      {signedIn ? (
        <>
          <DesktopIcon icon="folder" label="Sent" href="/cards" current={current === "sent"} />
          <DesktopIcon icon="signout" label="Sign out" action={logOut} />
        </>
      ) : (
        <DesktopIcon
          icon="person"
          label="Sign in"
          href={signInHref(next)}
          current={current === "sign-in"}
        />
      )}
    </>
  );
}
