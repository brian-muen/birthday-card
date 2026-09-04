"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";

// Kept in sync with the limits enforced in the client form.
const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;

export type AddMessageResult = { ok: true } | { ok: false; error: string };

export async function addMessage(input: {
  contributeToken: string;
  authorName: string;
  body: string;
}): Promise<AddMessageResult> {
  const contributeToken = input.contributeToken?.trim() ?? "";
  const authorName = input.authorName?.trim() ?? "";
  const body = input.body?.trim() ?? "";

  if (!contributeToken) {
    return { ok: false, error: "This signing link is not valid." };
  }
  if (!authorName) {
    return { ok: false, error: "Please add your name." };
  }
  if (authorName.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `Your name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }
  if (!body) {
    return { ok: false, error: "Please write a message." };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return {
      ok: false,
      error: `Your message must be ${MAX_BODY_LENGTH} characters or fewer.`,
    };
  }

  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.contributeToken, contributeToken),
  });

  if (!card) {
    return {
      ok: false,
      error: "This card no longer exists. Double-check your link.",
    };
  }

  await db.insert(messages).values({
    cardId: card.id,
    authorName,
    body,
  });

  return { ok: true };
}
