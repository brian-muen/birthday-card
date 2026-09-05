import { eq, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, type Card } from "@/lib/db/schema";
import { generateToken } from "@/lib/tokens";

export async function findCardByToken(token: string) {
  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: or(eq(cards.masterToken, token), eq(cards.giftToken, token)),
  });
  return card ?? null;
}

export async function ensureGiftToken(
  card: Card,
): Promise<Card & { giftToken: string }> {
  if (card.giftToken) return { ...card, giftToken: card.giftToken };
  const giftToken = generateToken();
  const db = await getDb();
  await db.update(cards).set({ giftToken }).where(eq(cards.id, card.id));
  return { ...card, giftToken };
}

export function isMasterLink(card: Card, token: string) {
  return card.masterToken === token;
}
