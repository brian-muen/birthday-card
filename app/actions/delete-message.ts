"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";

export type DeleteMessageResult = { ok: true } | { ok: false; error: string };

/**
 * Delete a single message from a card. The caller proves it holds the card's
 * master link by passing `masterToken`; the message id alone is never enough.
 */
export async function deleteMessage(
  masterToken: string,
  messageId: number,
): Promise<DeleteMessageResult> {
  if (typeof masterToken !== "string" || masterToken.length === 0) {
    return { ok: false, error: "Missing card token." };
  }
  if (!Number.isInteger(messageId)) {
    return { ok: false, error: "Invalid message." };
  }

  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });

  if (!card) {
    return { ok: false, error: "Card not found." };
  }

  await db
    .delete(messages)
    .where(and(eq(messages.id, messageId), eq(messages.cardId, card.id)));

  revalidatePath(`/card/${masterToken}`);

  return { ok: true };
}
