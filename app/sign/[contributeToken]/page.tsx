import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import MessageForm from "./message-form";
import "../../signing.css";

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
    <main className="signing-page">
      <header className="signing-heading">
        <h1>A note for {card.recipientName}</h1>
        <p>
          Private. Only they and the organizer will read it. The organizer
          shares the card when they are ready — nothing is held for a date.
        </p>
      </header>

      {card.intro ? (
        <p className="signing-intro">{card.intro}</p>
      ) : null}

      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
        stock={parseStock(card.stock)}
      />
    </main>
  );
}
