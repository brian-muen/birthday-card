import { asc, eq } from "drizzle-orm";

import { findCardByToken, isMasterLink } from "@/lib/card-access";
import { buildCardPdf } from "@/lib/card-pdf";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { parseDesign } from "@/lib/design";
import { parsePen } from "@/lib/pen";
import { parseStock } from "@/lib/stock";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ masterToken: string }> },
) {
  const { masterToken: token } = await params;

  const card = await findCardByToken(token);

  if (!card) {
    return new Response("Card not found", { status: 404 });
  }

  const db = await getDb();
  const showCount = isMasterLink(card, token);

  const notes = await db.query.messages.findMany({
    where: eq(messages.cardId, card.id),
    orderBy: [asc(messages.createdAt), asc(messages.id)],
  });

  const pdfBytes = await buildCardPdf({
    recipientName: card.recipientName,
    intro: card.intro,
    stock: parseStock(card.stock),
    design: parseDesign(card.design),
    showCount,
    notes: notes.map((note) => ({
      authorName: note.authorName,
      body: note.body,
      date: dateFormatter.format(note.createdAt),
      pen: parsePen(note.pen),
    })),
  });

  const asciiName =
    card.recipientName.replace(/[^\w \-]/g, "").trim() || "you";

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Birthday card for ${asciiName}.pdf"; filename*=UTF-8''${encodeURIComponent(
        `Birthday card for ${card.recipientName}.pdf`,
      )}`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
