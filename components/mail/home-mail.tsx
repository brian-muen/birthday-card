"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
import { useRef } from "react";

import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { zoomRects } from "@/components/os/zoom-rects";
import {
  dismissUntilLater,
  forgetCard,
  showAgain,
  useRememberedMail,
  type RememberedMail,
} from "@/lib/remembered-mail";
import "@/app/home-mail.css";

const OPEN_ID = "home-mail-open";
const ICON_ID = "home-mail-icon";

function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

function fromList(card: RememberedMail) {
  const names = card.senderCount > 3 ? card.senders.slice(0, 2) : card.senders;
  const others = card.senderCount - names.length;
  const parts = others > 0 ? [...names, others === 1 ? "1 other" : `${others} others`] : names;
  if (parts.length <= 2) return parts.join(" and ");
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function headlineFor(card: RememberedMail) {
  return card.noteIds.length
    ? `${card.recipientName}, you have mail for your birthday`
    : `${card.recipientName}, your birthday card is waiting`;
}

function detailFor(card: RememberedMail) {
  const total = card.noteIds.length;
  if (total === 0) return "No messages yet. Friends may still be signing.";
  const from = fromList(card);
  const count = plural(total, card.unread === total ? "new message" : "message");
  const summary = from ? `${count} from ${from}.` : `${count}.`;
  if (card.unread === total) return summary;
  return card.unread ? `${summary} ${card.unread} still unread.` : `${summary} All read.`;
}

/** The Mail icon on the home desktop, while this browser remembers a gift link. */
export function HomeMailIcon() {
  const { cards } = useRememberedMail();
  if (cards.length === 0) return null;
  const unread = cards.reduce((sum, card) => sum + card.unread, 0);

  return (
    <button
      id={ICON_ID}
      type="button"
      className="os-icon"
      aria-label={unread ? `Mail, ${unread} unread` : "Mail"}
      onClick={(event) => {
        const icon = event.currentTarget;
        flushSync(showAgain);
        const root = document.querySelector<HTMLElement>(".home-mail");
        if (root) {
          root.style.animation = "none";
          zoomRects(icon, root, { hide: root });
        }
        document.getElementById(OPEN_ID)?.focus({ preventScroll: true });
      }}
    >
      <span className="home-mail-icon-art">
        <PixelIcon name={unread ? "unread" : "mail"} />
        {unread ? (
          <span className="os-badge home-mail-badge" aria-hidden>
            {unread}
          </span>
        ) : null}
      </span>
      <span className="os-icon-label">Mail</span>
    </button>
  );
}

/**
 * A small window on the home desktop pointing back to gift links this
 * browser has opened. It announces itself politely and leaves focus on the
 * compose window; the Mail icon brings it back after Later.
 */
export function HomeMailWindow() {
  const { cards, later } = useRememberedMail();
  const rootRef = useRef<HTMLDivElement>(null);
  const [top, ...others] = cards;
  const shown = top != null && later !== top.token;

  function hadFocus() {
    return rootRef.current?.contains(document.activeElement) ?? false;
  }

  function dismiss() {
    if (!top) return;
    const refocus = hadFocus();
    const from = rootRef.current?.getBoundingClientRect();
    flushSync(() => dismissUntilLater(top.token));
    const icon = document.getElementById(ICON_ID);
    zoomRects(from, icon);
    if (refocus) icon?.focus({ preventScroll: true });
  }

  function forget() {
    if (!top) return;
    const refocus = hadFocus();
    flushSync(() => forgetCard(top.token));
    if (!refocus) return;
    const next =
      document.getElementById(OPEN_ID) ??
      document.querySelector<HTMLElement>(".os-dock .os-icon");
    next?.focus({ preventScroll: true });
  }

  return (
    <>
      <p className="sr-only" role="status">
        {shown ? `${headlineFor(top)}. ${detailFor(top)}` : ""}
      </p>
      {shown ? (
        <div
          ref={rootRef}
          className="home-mail"
          onKeyDown={(event) => {
            if (event.key === "Escape") dismiss();
          }}
        >
          <OsWindow
            key={top.token}
            title="Mail"
            draggable
            onClose={dismiss}
            closeLabel="Close until later"
            status={
              <button type="button" className="home-mail-forget" onClick={forget}>
                Forget this card on this computer
              </button>
            }
          >
            <div className="home-mail-body">
              <PixelIcon name={top.unread ? "unread" : "mail"} className="home-mail-art" />
              <div>
                <p className="home-mail-title">{headlineFor(top)}</p>
                <p className="home-mail-detail">{detailFor(top)}</p>
              </div>
            </div>
            {others.length ? (
              <div className="home-mail-more">
                <p>{others.length === 1 ? "And 1 more card:" : `And ${others.length} more cards:`}</p>
                <ul>
                  {others.map((card) => (
                    <li key={card.token}>
                      <Link href={`/card/${card.token}`}>{card.recipientName}’s card</Link>
                      <span>
                        {" "}
                        · {plural(card.noteIds.length, "message")}
                        {card.unread ? `, ${card.unread} unread` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="home-mail-actions">
              <button type="button" className="os-button" data-variant="quiet" onClick={dismiss}>
                Later
              </button>
              <Link id={OPEN_ID} href={`/card/${top.token}`} className="os-button">
                Open Mail
              </Link>
            </div>
          </OsWindow>
        </div>
      ) : null}
    </>
  );
}
