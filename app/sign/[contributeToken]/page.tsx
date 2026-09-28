import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Computer from "@/components/os/computer";
import { DesktopIcon } from "@/components/os/pixel-icon";
import { birthdayTiming } from "@/lib/birthday";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { parseStock } from "@/lib/stock";
import MessageForm from "./message-form";
import "../../reply.css";

const receivedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

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

  const stock = parseStock(card.stock);

  return (
    <Computer
      stock={stock}
      icons={<DesktopIcon icon="compose" label="Start a card" href="/" />}
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
