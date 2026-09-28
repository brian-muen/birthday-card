import { count, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import CoverSurface from "@/components/cover-surface";
import OrganizerBar from "@/components/organizer-bar";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { stockHex } from "@/lib/stock";
import "@/app/organizer.css";

function noteLabel(n: number) {
  if (n === 0) return "No notes yet";
  if (n === 1) return "1 note";
  return `${n} notes`;
}

const started = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

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
        <header className="cards-head">
          <h1>Your cards</h1>
          <p className="cards-lede">
            {owned.length === 0
              ? `Cards you save to ${organizer.email} will show up here.`
              : `Saved to ${organizer.email}.`}
          </p>
        </header>

        <ul className="cards-gallery">
          <li>
            <Link href="/" className="gallery-card gallery-new">
              <span className="gallery-cover gallery-new-cover" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="gallery-name">New card</span>
            </Link>
          </li>
          {owned.map((card) => (
            <li key={card.id}>
              <Link href={`/created/${card.masterToken}`} className="gallery-card">
                <span
                  className="gallery-cover"
                  style={{ ["--card-stock" as string]: stockHex(card.stock) }}
                  aria-hidden="true"
                >
                  <CoverSurface design={card.design} recipientName={card.recipientName} />
                </span>
                <span className="gallery-name">{card.recipientName}</span>
                <span className="gallery-meta">
                  {noteLabel(notesByCard.get(card.id) ?? 0)}
                  {card.createdAt ? ` · ${started.format(card.createdAt)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
