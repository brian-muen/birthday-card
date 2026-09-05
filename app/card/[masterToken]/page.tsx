import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { ensureGiftToken, findCardByToken, isMasterLink } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import CardBook from "./card-book";

type PageParams = { params: Promise<{ masterToken: string }> };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const getCard = cache(async (token: string) => {
  const card = await findCardByToken(token);
  if (!card) return null;
  return ensureGiftToken(card);
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
    robots: { index: false, follow: false },
  };
}

export default async function CardPage({ params }: PageParams) {
  const { masterToken: token } = await params;
  const card = await getCard(token);

  if (!card) notFound();

  const canManage = isMasterLink(card, token);

  const db = await getDb();
  const notes = await db.query.messages.findMany({
    where: eq(messages.cardId, card.id),
    orderBy: [asc(messages.createdAt), asc(messages.id)],
  });

  return (
    <main className="mx-auto flex w-full max-w-[52rem] flex-1 flex-col justify-center px-6 py-14 sm:py-20">
      <h1 className="sr-only">Happy birthday, {card.recipientName}</h1>

      <CardBook
        masterToken={canManage ? card.masterToken : ""}
        canManage={canManage}
        recipientName={card.recipientName}
        intro={card.intro}
        stock={parseStock(card.stock)}
        pdfHref={`/card/${token}/pdf`}
        notes={notes.map((note) => ({
          id: note.id,
          authorName: note.authorName,
          body: note.body,
          date: dateFormatter.format(note.createdAt),
        }))}
      />

      <div className="mt-14 border-t border-rule pt-6">
        <a
          href={`/card/${token}/pdf`}
          download
          className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Download the card as a PDF
        </a>
      </div>
    </main>
  );
}
