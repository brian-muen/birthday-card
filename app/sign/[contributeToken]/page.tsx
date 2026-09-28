import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Computer from "@/components/os/computer";
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
      menus={[{ label: "File", items: [{ label: "Start your own card", href: "/" }] }]}
    >
      <MessageForm
        contributeToken={card.contributeToken}
        recipientName={card.recipientName}
        intro={card.intro?.trim() || null}
        received={receivedFormat.format(card.createdAt)}
        stock={stock}
      />
    </Computer>
  );
}
