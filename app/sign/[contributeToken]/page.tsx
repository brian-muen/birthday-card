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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 py-16 sm:py-24">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/45">
          {card.occasion}
        </p>
        <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          A message for {card.recipientName}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/60">
          Friends are signing a group card together. Add your note below
          &mdash; nobody else&rsquo;s messages are shown here.
        </p>
      </header>

      {card.intro && (
        <blockquote className="border-l-2 border-foreground/30 pl-4 font-serif text-lg italic leading-relaxed text-foreground/70 whitespace-pre-wrap">
          {card.intro}
        </blockquote>
      )}

      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
      />

      <p className="text-center text-xs text-foreground/45">
        Your message stays private until {card.recipientName} opens the card.
      </p>
    </main>
  );
}
