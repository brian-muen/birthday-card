"use server";

import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { generateToken } from "@/lib/tokens";

// Kept in sync with the maxLength attributes on the form in app/page.tsx.
const RECIPIENT_NAME_MAX = 80;
const INTRO_MAX = 500;

export async function createCard(formData: FormData) {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();

  // Validation failures bounce back to the landing page with a message and the
  // name refilled, so the form keeps working without client-side JS.
  const fail = (message: string): never => {
    const params = new URLSearchParams({ error: message });
    if (recipientName) {
      params.set("recipientName", recipientName.slice(0, RECIPIENT_NAME_MAX));
    }
    redirect(`/?${params.toString()}`);
  };

  if (!recipientName) {
    fail("Whose birthday is it? Add their name.");
  }
  if (recipientName.length > RECIPIENT_NAME_MAX) {
    fail(`The name must be ${RECIPIENT_NAME_MAX} characters or fewer.`);
  }
  if (intro.length > INTRO_MAX) {
    fail(`Welcome note must be ${INTRO_MAX} characters or fewer.`);
  }

  const contributeToken = generateToken();
  const masterToken = generateToken();

  const db = await getDb();
  await db.insert(cards).values({
    recipientName,
    occasion: "Birthday",
    intro: intro || null,
    contributeToken,
    masterToken,
  });

  redirect(`/created/${masterToken}`);
}
