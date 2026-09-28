"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { PixelIcon } from "@/components/os/pixel-icon";

/** "Ana, Ben, Cy, and 2 others", or "" for no one. */
export function nameList(names: string[]) {
  if (names.length <= 2) return names.join(" and ");
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`;
  const others = names.length - 3;
  return `${names.slice(0, 3).join(", ")}, and ${others === 1 ? "1 other" : `${others} others`}`;
}

function fromLine(names: string[]) {
  return names.length ? `From ${nameList(names)}.` : "";
}

function headlineFor(count: number, canManage: boolean, recipientName: string) {
  if (canManage) {
    return count === 1
      ? `A new message has arrived for ${recipientName}`
      : `${count} new messages have arrived for ${recipientName}`;
  }
  return count === 1
    ? "You have a new message for your birthday"
    : `You have ${count} new messages for your birthday`;
}

/** The one thing on this screen that moves on its own: new mail. */
export default function InboxArrival({
  senders,
  canManage,
  recipientName,
  shareHref,
  onOpen,
  onDismiss,
}: {
  senders: string[];
  canManage: boolean;
  recipientName: string;
  shareHref: string;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const titleId = useId();
  const detailId = useId();
  const primaryRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const count = senders.length;
  const empty = count === 0;

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, []);

  const headline = empty
    ? canManage
      ? `No one has signed ${recipientName}’s card yet`
      : "You have no messages yet"
    : headlineFor(count, canManage, recipientName);

  const detail = empty
    ? canManage
      ? "Send the signing link from Share links, and each note arrives here as a message."
      : "When friends sign your card, each note arrives here as a message."
    : fromLine(senders);

  return (
    <div
      className="os-window inbox-alert"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={detailId}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDismiss();
      }}
    >
      <div className="os-titlebar">
        <button type="button" className="os-close" aria-label="Dismiss" onClick={onDismiss} />
        <h2 className="os-window-title">{empty ? "Mail" : "New mail"}</h2>
      </div>
      <div className="inbox-alert-body">
        <PixelIcon name={empty ? "mail" : "unread"} className="inbox-alert-icon" />
        <div>
          <p id={titleId} className="inbox-alert-title">
            {headline}
          </p>
          <p id={detailId} className="inbox-alert-detail">
            {detail}
          </p>
        </div>
      </div>
      <div className="inbox-alert-actions">
        {empty && canManage ? (
          <>
            <button type="button" className="os-button" data-variant="quiet" onClick={onOpen}>
              Open Mail
            </button>
            <Link ref={primaryRef} href={shareHref} className="os-button">
              Share links
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="os-button" data-variant="quiet" onClick={onDismiss}>
              Later
            </button>
            <button ref={primaryRef} type="button" className="os-button" onClick={onOpen}>
              Open Mail
            </button>
          </>
        )}
      </div>
    </div>
  );
}
