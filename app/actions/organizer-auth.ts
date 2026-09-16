"use server";

import { redirect } from "next/navigation";

import { destroyOrganizerSession } from "@/lib/organizer-auth";

export async function logOut() {
  await destroyOrganizerSession();
  redirect("/");
}
