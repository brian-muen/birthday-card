import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import CardBook from "./card-book";

type PageParams = { params: Promise<{ masterToken: string }> };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

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
      ? `Happy Birthday, ${card.recipientName}`
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
    <main className="mx-auto flex w-full max-w-[52rem] flex-1 flex-col justify-center px-6 py-14 sm:py-20">
      {/* The cover is set as a printed object, not a heading, so the document
          still needs a title for anyone reading it with a screen reader. */}
      <h1 className="sr-only">Happy birthday, {card.recipientName}</h1>

      <CardBook
        masterToken={masterToken}
        recipientName={card.recipientName}
        intro={card.intro}
        stock={parseStock(card.stock)}
        notes={notes.map((note) => ({
          id: note.id,
          authorName: note.authorName,
          body: note.body,
          date: dateFormatter.format(note.createdAt),
        }))}
      />

      <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-rule pt-6">
        <a
          href={`/card/${masterToken}/pdf`}
          download
          className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Download the card as a PDF
        </a>
        <p className="text-[0.8125rem] text-muted">
          Anyone with this link can read every message.
        </p>
      </div>
    </main>
  );
}
