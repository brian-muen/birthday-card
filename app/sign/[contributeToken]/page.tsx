import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import MessageForm from "./message-form";

export default async function SignPage({
  params,
}: {
  params: Promise<{ contributeToken: string }>;
}) {
  const { contributeToken } = await params;

  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.contributeToken, contributeToken),
  });

  if (!card) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="font-serif text-[2.15rem] leading-[1.15] tracking-[-0.015em] sm:text-[2.6rem]">
          A note for {card.recipientName}.
        </h1>
        <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted">
          You are writing inside {card.recipientName}&rsquo;s birthday card.
          Only they and the person who started the card will see it. It reaches
          them when that person shares the recipient link — not on a schedule.
        </p>
      </div>

      {card.intro && (
        <blockquote className="mt-10 max-w-2xl border-l border-rule pl-5 font-hand text-xl leading-[1.6] whitespace-pre-wrap">
          {card.intro}
        </blockquote>
      )}

      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
        stock={parseStock(card.stock)}
      />
    </main>
  );
}
