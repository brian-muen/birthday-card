"use client";

import Link from "next/link";

import CoverThumb from "@/components/mail/outbox-thumb";
import { AppWindow } from "@/components/os/desktop";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { formatBirthday } from "@/lib/birthday";
import type { SentCardRow } from "@/lib/sent-cards";
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

/** The Sent mailbox as a window on the current desktop. */
export default function SentFolder({
  cards,
  email,
}: {
  cards: SentCardRow[];
  email: string;
}) {
  return (
    <AppWindow app="sent">
      <OsWindow
        title="Sent"
        width="44rem"
        className="outbox-folder"
        draggable
        raiseOnMount
        toolbar={
          <p className="outbox-toolbar-note">Saved to {email}</p>
        }
        status={<span>{cards.length === 1 ? "1 card" : `${cards.length} cards`}</span>}
      >
        {cards.length === 0 ? (
          <div className="outbox-empty">
            <PixelIcon name="folder" className="outbox-empty-icon" />
            <h2>Nothing in Sent yet</h2>
            <p>Every card you start lands here, links and all.</p>
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
              {cards.map((card) => (
                <li key={card.masterToken}>
                  <Link href={`/created/${card.masterToken}`} className="outbox-row">
                    <CoverThumb
                      design={card.design}
                      stockHex={stockHex(card.stock)}
                      className="outbox-row-thumb"
                    />
                    <span className="outbox-row-name">{card.recipientName}</span>
                    <span className="outbox-row-subject">
                      {card.birthday ? (
                        <span className="outbox-row-tag">
                          Birthday {formatBirthday(card.birthday, "short")}
                        </span>
                      ) : null}
                      Sign {card.recipientName}’s birthday card
                      {card.birthday ? ` (${formatBirthday(card.birthday, "short")})` : ""}
                    </span>
                    <span className="outbox-row-notes" data-none={card.notes === 0 || undefined}>
                      {noteLabel(card.notes)}
                    </span>
                    <span className="outbox-row-date">
                      {card.createdAt ? started.format(new Date(card.createdAt)) : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </OsWindow>
    </AppWindow>
  );
}
