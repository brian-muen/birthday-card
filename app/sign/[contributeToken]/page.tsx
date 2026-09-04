import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-16">
      <header className="text-center">
        <span className="inline-block rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm shadow-rose-500/20">
          {card.occasion}
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Leave a message for {card.recipientName}
        </h1>
        <p className="mt-3 text-base text-stone-600 sm:text-lg">
          Friends are signing a group card together. Add your note below —
          nobody else&rsquo;s messages are shown here.
        </p>
      </header>

      {card.intro && (
        <blockquote className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-5 py-4 text-[0.975rem] leading-relaxed text-amber-950 sm:px-6">
          {card.intro}
        </blockquote>
      )}

      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
      />

      <p className="text-center text-xs text-stone-500">
        Your message stays private until {card.recipientName} opens the card.
      </p>
    </main>
  );
}
