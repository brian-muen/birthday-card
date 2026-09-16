import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";

export type ClaimResult = "attached" | "already-yours" | "taken" | "missing";

export async function attachCardToOrganizer(
  masterToken: string,
  organizerId: number,
): Promise<ClaimResult> {
  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });
  if (!card) return "missing";
  if (card.organizerId === organizerId) return "already-yours";
  if (card.organizerId != null) return "taken";

  const updated = await db
    .update(cards)
    .set({ organizerId })
    .where(and(eq(cards.id, card.id), isNull(cards.organizerId)))
    .returning({ id: cards.id });

  return updated.length > 0 ? "attached" : "taken";
}
