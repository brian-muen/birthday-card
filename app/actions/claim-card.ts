"use server";

import { redirect } from "next/navigation";

import { attachCardToOrganizer } from "@/lib/claim-card";
import { getCurrentOrganizer } from "@/lib/organizer-auth";

export async function claimCard(formData: FormData) {
  const masterToken = String(formData.get("masterToken") ?? "").trim();
  const organizer = await getCurrentOrganizer();

  if (!organizer) {
    const next = masterToken ? `/created/${masterToken}` : "/cards";
    redirect(`/account?next=${encodeURIComponent(next)}`);
  }

  const result = await attachCardToOrganizer(masterToken, organizer.id);
  if (result === "missing") {
    redirect("/");
  }
  if (result === "taken") {
    redirect(`/created/${masterToken}?saveError=taken`);
  }

  redirect(`/created/${masterToken}?saved=1`);
}
