import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import DeleteButton from "./delete-button";

type PageParams = { params: Promise<{ masterToken: string }> };

const NOTE_TINTS = [
  "bg-rose-50 border-rose-100",
  "bg-amber-50 border-amber-100",
  "bg-sky-50 border-sky-100",
  "bg-violet-50 border-violet-100",
  "bg-emerald-50 border-emerald-100",
];

const NOTE_ROTATIONS = ["-rotate-1", "rotate-1", "rotate-0"];

const CONFETTI = [
  "bg-rose-300",
  "bg-amber-300",
  "bg-sky-300",
  "bg-violet-300",
  "bg-emerald-300",
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
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

  if (!occ) return name ? `For ${name}!` : "A group card";

  const lower = occ.toLowerCase();
  const phrase = GREETINGS.some((g) => lower.startsWith(g)) ? occ : `Happy ${occ}`;

  return name ? `${phrase}, ${name}!` : `${phrase}!`;
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">
          A group card
        </p>

        <h1 className="mt-4 bg-linear-to-r from-rose-600 via-orange-500 to-violet-600 bg-clip-text pb-1 text-4xl font-bold leading-tight tracking-tight text-transparent text-balance sm:text-6xl">
          {buildHeading(card.occasion, card.recipientName)}
        </h1>

        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden>
          <span className="h-px w-10 bg-foreground/10" />
          {CONFETTI.map((dot) => (
            <span key={dot} className={`h-2 w-2 rounded-full ${dot}`} />
          ))}
          <span className="h-px w-10 bg-foreground/10" />
        </div>

        {card.intro ? (
          <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground/75 text-pretty">
            {card.intro}
          </p>
        ) : null}

        <p className="mt-6 inline-flex items-center rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-foreground/60 ring-1 ring-black/5">
          {notes.length === 0
            ? "No messages yet"
            : `${notes.length} ${notes.length === 1 ? "message" : "messages"}`}
        </p>
      </header>

      {notes.length === 0 ? (
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-foreground/15 px-6 py-14 text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/55">
            Share the contributor link with friends — every message they leave
            will show up right here.
          </p>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-1 items-start gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, index) => (
            <li
              key={note.id}
              className={`group relative rounded-2xl border p-6 shadow-sm transition duration-200 hover:rotate-0 hover:shadow-md print:rotate-0 print:shadow-none ${
                NOTE_TINTS[index % NOTE_TINTS.length]
              } ${NOTE_ROTATIONS[index % NOTE_ROTATIONS.length]}`}
            >
              <DeleteButton
                masterToken={masterToken}
                messageId={note.id}
                authorName={note.authorName}
              />

              <p className="whitespace-pre-wrap break-words pr-6 leading-relaxed text-foreground/90">
                {note.body}
              </p>

              <footer className="mt-5 flex items-baseline justify-between gap-3 border-t border-black/5 pt-3">
                <p className="font-medium text-foreground">
                  — {note.authorName}
                </p>
                <p className="shrink-0 text-xs text-foreground/40">
                  {dateFormatter.format(note.createdAt)}
                </p>
              </footer>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-16 text-center text-xs text-foreground/40 print:hidden">
        Anyone with this link can read every message. Hover a note to remove it.
      </p>
    </main>
  );
}
