import { count, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";

export type SentCardRow = {
  masterToken: string;
  recipientName: string;
  design: string;
  stock: string;
  birthday: string | null;
  createdAt: string | null;
  notes: number;
};

/** The signed-in organizer's cards, newest first. */
export async function listSentCards(organizerId: number): Promise<SentCardRow[]> {
  const db = await getDb();
  const owned = await db
    .select()
    .from(cards)
    .where(eq(cards.organizerId, organizerId))
    .orderBy(desc(cards.createdAt));

  const tallies = owned.length
    ? await db
        .select({ cardId: messages.cardId, n: count() })
        .from(messages)
        .where(
          inArray(
            messages.cardId,
            owned.map((card) => card.id),
          ),
        )
        .groupBy(messages.cardId)
    : [];
  const notesByCard = new Map(tallies.map((row) => [row.cardId, row.n]));

  return owned.map((card) => ({
    masterToken: card.masterToken,
    recipientName: card.recipientName,
    design: card.design,
    stock: card.stock,
    birthday: card.birthday,
    createdAt: card.createdAt ? card.createdAt.toISOString() : null,
    notes: notesByCard.get(card.id) ?? 0,
  }));
}
