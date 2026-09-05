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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
      <h1 className="font-serif text-[2.25rem] leading-[1.15] tracking-[-0.01em] sm:text-[2.75rem]">
        Add your message to {card.recipientName}&rsquo;s card.
      </h1>
      <p className="mt-5 max-w-[58ch] text-[1.0625rem] leading-relaxed text-muted">
        Friends are signing a birthday card for {card.recipientName} together.
        Yours becomes a note inside it.
      </p>

      {card.intro && (
        <blockquote className="mt-10 border-l border-rule pl-5 font-serif text-xl leading-[1.6] whitespace-pre-wrap">
          {card.intro}
        </blockquote>
      )}

      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
      />
    </main>
  );
}
