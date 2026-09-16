import { count, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import OrganizerBar from "@/components/organizer-bar";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import "@/app/organizer.css";

export default async function CardsPage() {
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    redirect("/account?next=/cards");
  }

  const db = await getDb();
  const owned = await db
    .select()
    .from(cards)
    .where(eq(cards.organizerId, organizer.id))
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

  return (
    <>
      <OrganizerBar />
      <main className="cards-page">
        <h1>Your cards</h1>
        <p className="cards-lede">
          Cards you saved to {organizer.email}. Signing still works from the
          invitation link, with no account.
        </p>
        {owned.length === 0 ? (
          <p className="cards-empty">
            None saved yet.{" "}
            <Link href="/" className="handoff-open">
              Make a card
            </Link>
            , then save it to this account.
          </p>
        ) : (
          <ul className="cards-list">
            {owned.map((card) => {
              const notes = notesByCard.get(card.id) ?? 0;
              return (
                <li key={card.id}>
                  <h2>{card.recipientName}</h2>
                  <p>
                    {notes === 0
                      ? "No notes yet"
                      : notes === 1
                        ? "1 note"
                        : `${notes} notes`}
                    {card.createdAt
                      ? ` · ${card.createdAt.toLocaleDateString()}`
                      : ""}
                  </p>
                  <div className="cards-list-actions">
                    <Link href={`/created/${card.masterToken}`}>Manage</Link>
                    {card.giftToken ? (
                      <Link href={`/card/${card.giftToken}`}>Open card</Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
