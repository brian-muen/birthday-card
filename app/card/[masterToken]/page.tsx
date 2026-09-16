import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { ensureGiftToken, findCardByToken, isMasterLink } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { parseDesign } from "@/lib/design";
import { parsePen } from "@/lib/pen";
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
    <main className="recipient-page">
      <h1 className="sr-only">Happy birthday, {card.recipientName}</h1>

      <CardBook
        masterToken={canManage ? card.masterToken : ""}
        canManage={canManage}
        recipientName={card.recipientName}
        design={parseDesign(card.design)}
        intro={card.intro}
        dedication={card.dedication}
        stock={parseStock(card.stock)}
        notes={notes.map((note) => ({
          id: note.id,
          authorName: note.authorName,
          body: note.body,
          date: dateFormatter.format(note.createdAt),
          pen: parsePen(note.pen),
          image: note.image,
        }))}
      />

      <footer className="recipient-keepsake">
        <a
          href={`/card/${token}/pdf`}
          download
          className="quiet-link text-[0.9375rem] font-medium"
        >
          Save a PDF keepsake
        </a>
      </footer>
    </main>
  );
}
