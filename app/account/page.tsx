import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrganizerIcons } from "@/components/mail/organizer-icons";
import SignInWindow from "@/components/mail/sign-in-window";
import Computer from "@/components/os/computer";
import { AppIcon, AppWindow } from "@/components/os/desktop";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { safeNextPath } from "@/lib/safe-next-path";

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
      icons={
        <OrganizerIcons signedIn={false} current="sign-in">
          <AppIcon app="sign-in" icon="person" label="Sign in" />
        </OrganizerIcons>
      }
    >
      <AppWindow app="sign-in">
        <SignInWindow next={nextPath} error={error} />
      </AppWindow>
    </Computer>
  );
}
