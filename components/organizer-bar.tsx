import Link from "next/link";

import { logOut } from "@/app/actions/organizer-auth";
import ActionButton from "@/components/action-button";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import "@/app/organizer.css";

export default async function OrganizerBar() {
  const organizer = await getCurrentOrganizer();

  return (
    <nav className="organizer-bar" aria-label="Organizer account">
      <Link href="/" className="organizer-home">
        Birthday card
      </Link>
      {organizer ? (
        <div className="organizer-bar-actions">
          <Link href="/cards">Your cards</Link>
          <form action={logOut}>
            <ActionButton pendingLabel="Signing out…" className="organizer-text-button">
              Sign out
            </ActionButton>
          </form>
        </div>
      ) : (
        <Link href="/account">Sign in</Link>
      )}
    </nav>
  );
}
