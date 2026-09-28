import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { ensureGiftToken, findCardByToken, isMasterLink } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { parseDesign } from "@/lib/design";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { parsePen } from "@/lib/pen";
import { parseStock } from "@/lib/stock";
import InboxApp from "./inbox-app";
import { previewFor, subjectFor } from "./inbox-subject";
import "../../inbox.css";

type PageParams = { params: Promise<{ masterToken: string }> };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
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
      ? `Happy birthday, ${card.recipientName}`
      : "Card not found",
    robots: { index: false, follow: false },
  };
}

export default async function CardPage({ params }: PageParams) {
  const { masterToken: token } = await params;
  const card = await getCard(token);

  if (!card) notFound();

  const canManage = isMasterLink(card, token);
  // Organizers preview the gift link from their outbox; only the recipient's visits count.
  const organizer = canManage || card.organizerId == null ? null : await getCurrentOrganizer();
  const remember = !canManage && organizer?.id !== card.organizerId;

  const db = await getDb();
  const notes = await db.query.messages.findMany({
    where: eq(messages.cardId, card.id),
    orderBy: [asc(messages.createdAt), asc(messages.id)],
  });

  return (
    <>
      <h1 className="sr-only">Happy birthday, {card.recipientName}</h1>
      <InboxApp
        token={token}
        masterToken={canManage ? card.masterToken : ""}
        canManage={canManage}
        remember={remember}
        recipientName={card.recipientName}
        design={parseDesign(card.design)}
        intro={card.intro}
        dedication={card.dedication}
        stock={parseStock(card.stock)}
        birthday={card.birthday}
        notes={notes.map((note) => ({
          id: note.id,
          authorName: note.authorName,
          body: note.body,
          date: dateFormatter.format(note.createdAt),
          shortDate: shortDateFormatter.format(note.createdAt),
          subject: subjectFor(note.body),
          preview: previewFor(note.body),
          pen: parsePen(note.pen),
          image: note.image,
        }))}
      />
    </>
  );
}
