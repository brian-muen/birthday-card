import { logOut } from "@/app/actions/organizer-auth";
import type { Menu, MenuItem } from "@/components/os/menu-bar";

export function signInHref(next?: string) {
  return next ? `/account?next=${encodeURIComponent(next)}` : "/account";
}

/** The File menu every organizer page shares; `next` is where sign-in returns to. */
export function organizerMenus({
  signedIn,
  next,
}: {
  signedIn: boolean;
  next?: string;
}): Menu[] {
  const items: MenuItem[] = [{ label: "New card", href: "/" }];
  if (signedIn) {
    items.push({ label: "Sent cards", href: "/cards" }, { label: "Sign out", action: logOut });
  } else {
    items.push({ label: "Sign in", href: signInHref(next) });
  }
  return [{ label: "File", items }];
}
