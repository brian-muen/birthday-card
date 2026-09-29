import { redirect } from "next/navigation";

import { getCurrentOrganizer } from "@/lib/organizer-auth";

/** Old address for the mailbox. Sent is a window on the desktop now. */
export default async function CardsPage() {
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    redirect("/account?next=/?sent=1");
  }
  redirect("/?sent=1");
}
