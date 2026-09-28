import { count, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { organizerMenus } from "@/components/mail/compose-menus";
import CoverThumb from "@/components/mail/outbox-thumb";
import Computer from "@/components/os/computer";
import OsWindow from "@/components/os/os-window";
import { DesktopIcon, PixelIcon } from "@/components/os/pixel-icon";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { stockHex } from "@/lib/stock";
import "@/app/outbox.css";

function noteLabel(n: number) {
  if (n === 0) return "No notes";
  if (n === 1) return "1 note";
  return `${n} notes`;
}

const started = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CardsPage() {
  const organizer = await getCurrentOrganizer();
  if (!organizer) {
    redirect("/account?next=/cards");
  }

  const db = await getDb();
  const owned = await db
    .select()
    .from(cards)
    .where(eq(cards.organizerId, organizer.id))
    .orderBy(desc(cards.createdAt));

  const tallies = owned.length
    ? await db
        .select({ cardId: messages.cardId, n: count() })
        .from(messages)
        .where(
          inArray(
            messages.cardId,
            owned.map((card) => card.id),
          ),
        )
        .groupBy(messages.cardId)
    : [];
  const notesByCard = new Map(tallies.map((row) => [row.cardId, row.n]));

  return (
    <Computer menus={organizerMenus({ signedIn: true })}>
      <h1 className="sr-only">Sent cards</h1>
      <OsWindow
        title="Sent"
        width="52rem"
        className="outbox-folder"
        draggable
        toolbar={
          <>
            <Link href="/" className="os-button">
              <PixelIcon name="compose" className="outbox-button-icon" />
              New card
            </Link>
            <p className="outbox-toolbar-note">Saved to {organizer.email}</p>
          </>
        }
        status={
          <span>
            {owned.length === 1 ? "1 card" : `${owned.length} cards`}
          </span>
        }
      >
        {owned.length === 0 ? (
          <div className="outbox-empty">
            <PixelIcon name="folder" className="outbox-empty-icon" />
            <h2>Nothing in Sent yet</h2>
            <p>
              Cards you start while signed in land here, along with any you save
              from a card’s links page.
            </p>
            <Link href="/" className="os-button">
              New card
            </Link>
          </div>
        ) : (
          <>
            <div className="outbox-columns" aria-hidden="true">
              <span />
              <span>For</span>
              <span>Subject</span>
              <span>Notes</span>
              <span>Started</span>
            </div>
            <ul className="outbox-list">
              {owned.map((card) => {
                const notes = notesByCard.get(card.id) ?? 0;
                return (
                  <li key={card.id}>
                    <Link href={`/created/${card.masterToken}`} className="outbox-row">
                      <CoverThumb
                        design={card.design}
                        stockHex={stockHex(card.stock)}
                        className="outbox-row-thumb"
                      />
                      <span className="outbox-row-name">{card.recipientName}</span>
                      <span className="outbox-row-subject">
                        Sign {card.recipientName}’s birthday card
                      </span>
                      <span className="outbox-row-notes" data-none={notes === 0 || undefined}>
                        {noteLabel(notes)}
                      </span>
                      <span className="outbox-row-date">
                        {card.createdAt ? started.format(card.createdAt) : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </OsWindow>

      <div className="os-icons">
        <DesktopIcon icon="compose" label="New card" href="/" />
        <DesktopIcon icon="folder" label="Sent" href="/cards" current />
      </div>
    </Computer>
  );
}
