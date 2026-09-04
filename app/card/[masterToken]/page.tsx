import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import CardBook from "./card-book";

type PageParams = { params: Promise<{ masterToken: string }> };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

// Occasions that already read as a greeting ("Merry Christmas") shouldn't get
// another "Happy" bolted onto the front.
const GREETINGS = [
  "happy",
  "merry",
  "congrat",
  "thank",
  "good luck",
  "welcome",
  "farewell",
  "get well",
  "bon voyage",
  "well done",
  "best wishes",
  "so long",
];

function buildHeading(occasion: string, recipientName: string) {
  const name = recipientName.trim();
  const occ = occasion.trim().replace(/[!.,]+$/, "");

  if (!occ) return name ? `For ${name}` : "A group card";

  const lower = occ.toLowerCase();
  const phrase = GREETINGS.some((g) => lower.startsWith(g))
    ? occ
    : `Happy ${occ}`;

  return name ? `${phrase}, ${name}` : phrase;
}

const getCard = cache(async (masterToken: string) => {
  const db = await getDb();
  return db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });
});

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { masterToken } = await params;
  const card = await getCard(masterToken);

  return {
    title: card
      ? buildHeading(card.occasion, card.recipientName)
      : "Card not found",
    // The master link is secret — keep it out of search results.
    robots: { index: false, follow: false },
  };
}

export default async function CardPage({ params }: PageParams) {
  const { masterToken } = await params;
  const card = await getCard(masterToken);

  if (!card) notFound();

  const db = await getDb();
  const notes = await db.query.messages.findMany({
    where: eq(messages.cardId, card.id),
    orderBy: [asc(messages.createdAt), asc(messages.id)],
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-12 sm:py-16">
      <CardBook
        masterToken={masterToken}
        heading={buildHeading(card.occasion, card.recipientName)}
        occasion={card.occasion}
        recipientName={card.recipientName}
        intro={card.intro}
        notes={notes.map((note) => ({
          id: note.id,
          authorName: note.authorName,
          body: note.body,
          date: dateFormatter.format(note.createdAt),
        }))}
      />

      <p className="mt-10 text-center text-xs text-foreground/40">
        Anyone with this link can read every message.
      </p>
    </main>
  );
}
