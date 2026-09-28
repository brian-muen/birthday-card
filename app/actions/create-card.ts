"use server";

import { redirect } from "next/navigation";

import { parseBirthday } from "@/lib/birthday";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { parseStock } from "@/lib/stock";
import { parseDesign } from "@/lib/design";
import { generateToken } from "@/lib/tokens";

// Kept in sync with the maxLength attributes on the form in app/page.tsx.
const RECIPIENT_NAME_MAX = 80;
const INTRO_MAX = 500;

export async function createCard(formData: FormData) {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const stock = parseStock(formData.get("stock"));
  const design = parseDesign(formData.get("design"));
  const birthdayInput = String(formData.get("birthday") ?? "").trim();

  // Validation failures bounce back to the landing page with a message and the
  // name refilled, so the form keeps working without client-side JS.
  const draftParams = () => {
    const params = new URLSearchParams();
    if (recipientName) {
      params.set("recipientName", recipientName.slice(0, RECIPIENT_NAME_MAX));
    }
    if (birthdayInput) params.set("birthday", birthdayInput.slice(0, 10));
    params.set("stock", stock);
    params.set("design", design);
    return params;
  };
  const fail = (message: string): never => {
    const params = draftParams();
    params.set("error", message);
    redirect(`/?${params.toString()}`);
  };

  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    redirect(`/account?next=${encodeURIComponent(`/?${draftParams().toString()}`)}`);
  }

  if (!recipientName) {
    fail("Whose birthday is it? Add their name.");
  }
  if (recipientName.length > RECIPIENT_NAME_MAX) {
    fail(`The name must be ${RECIPIENT_NAME_MAX} characters or fewer.`);
  }
  if (intro.length > INTRO_MAX) {
    fail(`Welcome note must be ${INTRO_MAX} characters or fewer.`);
  }
  const birthday = parseBirthday(birthdayInput);
  if (!birthday.ok) {
    fail(birthday.error);
  }

  const contributeToken = generateToken();
  const masterToken = generateToken();
  const giftToken = generateToken();

  const db = await getDb();
  await db.insert(cards).values({
    recipientName,
    occasion: "Birthday",
    intro: intro || null,
    dedication: null,
    birthday: birthday.ok ? birthday.birthday : null,
    stock,
    design,
    contributeToken,
    masterToken,
    giftToken,
    organizerId: organizer.id,
  });

  redirect(`/created/${masterToken}`);
}
