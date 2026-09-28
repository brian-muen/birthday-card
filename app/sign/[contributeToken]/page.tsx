import type { Metadata } from "next";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Computer from "@/components/os/computer";
import { AppIcon } from "@/components/os/desktop";
import { DesktopIcon } from "@/components/os/pixel-icon";
import { birthdayTiming } from "@/lib/birthday";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import MessageForm from "./message-form";
import "../../reply.css";

type PageParams = { params: Promise<{ contributeToken: string }> };

const receivedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const getCard = cache(async (contributeToken: string) => {
  const db = await getDb();
  return db.query.cards.findFirst({
    where: eq(cards.contributeToken, contributeToken),
  });
});

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { contributeToken } = await params;
  const card = await getCard(contributeToken);
  return {
    title: card ? `Sign ${card.recipientName}’s card` : "Card not found",
    robots: { index: false, follow: false },
  };
}

export default async function SignPage({ params }: PageParams) {
  const { contributeToken } = await params;
  const card = await getCard(contributeToken);

  if (!card) {
    notFound();
  }

  const stock = parseStock(card.stock);

  return (
    <Computer
      stock={stock}
      icons={
        <>
          <AppIcon app="mail" icon="mail" label="Mail" />
          <DesktopIcon icon="compose" label="Start a card" href="/" />
        </>
      }
      birthday={
        card.birthday
          ? { day: card.birthday, greeting: `It’s ${card.recipientName}’s birthday!` }
          : null
      }
    >
      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
        intro={card.intro?.trim() || null}
        birthday={card.birthday ? birthdayTiming(card.birthday) : null}
        received={receivedFormat.format(card.createdAt)}
        stock={stock}
      />
    </Computer>
  );
}
