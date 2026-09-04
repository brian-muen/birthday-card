"use server";

import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { generateToken } from "@/lib/tokens";

// Kept in sync with the maxLength attributes on the form in app/page.tsx.
const RECIPIENT_NAME_MAX = 80;
const OCCASION_MAX = 60;
const INTRO_MAX = 500;

export async function createCard(formData: FormData) {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const occasion = String(formData.get("occasion") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();

  // Validation failures bounce back to the landing page with a message and the
  // short fields refilled, so the form keeps working without client-side JS.
  const fail = (message: string): never => {
    const params = new URLSearchParams({ error: message });
    if (recipientName) {
      params.set("recipientName", recipientName.slice(0, RECIPIENT_NAME_MAX));
    }
    if (occasion) {
      params.set("occasion", occasion.slice(0, OCCASION_MAX));
    }
    redirect(`/?${params.toString()}`);
  };

  if (!recipientName) {
    fail("Who is this card for? Add a recipient name.");
  }
  if (recipientName.length > RECIPIENT_NAME_MAX) {
    fail(`Recipient name must be ${RECIPIENT_NAME_MAX} characters or fewer.`);
  }
  if (!occasion) {
    fail("What's the occasion? Birthday, farewell, thank you…");
  }
  if (occasion.length > OCCASION_MAX) {
    fail(`Occasion must be ${OCCASION_MAX} characters or fewer.`);
  }
  if (intro.length > INTRO_MAX) {
    fail(`Welcome note must be ${INTRO_MAX} characters or fewer.`);
  }

  const contributeToken = generateToken();
  const masterToken = generateToken();

  const db = await getDb();
  await db.insert(cards).values({
    recipientName,
    occasion,
    intro: intro || null,
    contributeToken,
    masterToken,
  });

  redirect(`/created/${masterToken}`);
}
