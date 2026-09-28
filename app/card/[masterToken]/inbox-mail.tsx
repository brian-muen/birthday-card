"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";

import { deleteMessage } from "@/app/actions/delete-message";
import { getServerFalse, subscribeToQuery } from "@/components/folded-card";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import type { PenId } from "@/lib/pen";
import { BalloonGlyph } from "./inbox-balloons";

export type InboxNote = {
  id: number;
  authorName: string;
  body: string;
  date: string;
  shortDate: string;
  subject: string;
  preview: string;
  pen: PenId;
  image?: string | null;
};

export type Pane = "list" | "message";

const WIDE_QUERY = "(min-width: 48rem)";
const subscribeToWide = subscribeToQuery(WIDE_QUERY);
const getWide = () => window.matchMedia(WIDE_QUERY).matches;

/** Two panes side by side at this width; below it, list then message. */
export function useWide() {
  return useSyncExternalStore(subscribeToWide, getWide, getServerFalse);
}

function countLabel(total: number, unread: number) {
  if (total === 0) return "No messages";
  const messages = total === 1 ? "1 message" : `${total} messages`;
  return unread ? `${messages}, ${unread} unread` : messages;
}

export default function InboxMail({
  notes,
  recipientName,
  canManage,
  masterToken,
  shareHref,
  selectedId,
  onSelect,
  pane,
  onPane,
  readIds,
  setRead,
  onTransform,
  onClose,
  transformRef,
  focusOnMount,
}: {
  notes: InboxNote[];
  recipientName: string;
  canManage: boolean;
  masterToken: string;
  shareHref: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  pane: Pane;
  onPane: (pane: Pane) => void;
  readIds: Set<number>;
  setRead: (id: number, isRead: boolean) => void;
  onTransform: () => void;
  onClose: () => void;
  transformRef: RefObject<HTMLButtonElement | null>;
  focusOnMount: "list" | "transform";
}) {
  const wide = useWide();
  const listRef = useRef<HTMLUListElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState("");

  const index = notes.findIndex((note) => note.id === selectedId);
  const selected = index >= 0 ? notes[index] : null;
  const shownId = selected && (wide || pane === "message") ? selected.id : null;
  const unread = notes.filter((note) => !readIds.has(note.id)).length;

  const lastShown = useRef<number | null>(null);
  useEffect(() => {
    if (shownId !== null && shownId !== lastShown.current) setRead(shownId, true);
    lastShown.current = shownId;
  }, [shownId, setRead]);

  const mountFocus = useRef(focusOnMount);
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      '[role="option"][tabindex="0"]',
    );
    row?.scrollIntoView({ block: "nearest" });
    if (mountFocus.current === "transform") {
      transformRef.current?.focus({ preventScroll: true });
    } else {
      row?.focus({ preventScroll: true });
    }
  }, [transformRef]);

  function focusRow(id: number) {
    listRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
  }

  function openMessage(id: number) {
    flushSync(() => {
      onSelect(id);
      if (!wide) onPane("message");
    });
    if (!wide) readerRef.current?.focus({ preventScroll: true });
  }

  function backToList() {
    flushSync(() => onPane("list"));
    if (selected) focusRow(selected.id);
  }

  function onListKey(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey || notes.length === 0) return;
    const at = Math.max(0, index);
    const moves: Record<string, number> = {
      ArrowDown: Math.min(notes.length - 1, index + 1),
      j: Math.min(notes.length - 1, index + 1),
      ArrowUp: Math.max(0, at - 1),
      k: Math.max(0, at - 1),
      Home: 0,
      End: notes.length - 1,
    };
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!selected) return;
      if (wide) readerRef.current?.focus();
      else openMessage(selected.id);
      return;
    }
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const note = notes[next];
    flushSync(() => onSelect(note.id));
    focusRow(note.id);
  }

  function toggleRead() {
    if (shownId === null) return;
    const isRead = readIds.has(shownId);
    setRead(shownId, !isRead);
    setNotice(isRead ? "Marked as unread" : "Marked as read");
  }

  function onRemoved(nextId: number | null) {
    flushSync(() => {
      if (nextId !== null) onSelect(nextId);
      else onPane("list");
    });
    setNotice("Note removed");
    readerRef.current?.focus({ preventScroll: true });
  }

  const toolbar = (
    <>
      {pane === "message" && !wide ? (
        <button type="button" className="os-button" data-variant="quiet" onClick={backToList}>
          Back
        </button>
      ) : null}
      {shownId !== null ? (
        <button type="button" className="os-button" data-variant="quiet" onClick={toggleRead}>
          {readIds.has(shownId) ? "Mark as unread" : "Mark as read"}
        </button>
      ) : null}
      <button
        ref={transformRef}
        type="button"
        className="os-button inbox-transform"
        data-variant="accent"
        aria-label="Transform into the paper card"
        onClick={onTransform}
      >
        <BalloonGlyph />
        Transform
      </button>
    </>
  );

  const status = (
    <>
      <span>{countLabel(notes.length, unread)}</span>
      {canManage ? <span>Organizer view</span> : null}
    </>
  );

  return (
    <OsWindow
      title="Mail"
      width="64rem"
      draggable
      onClose={onClose}
      closeLabel="Close Mail"
      toolbar={toolbar}
      status={status}
      className="inbox-mail"
    >
      <p role="status" aria-live="polite" className="sr-only">
        {notice}
      </p>
      {notes.length === 0 ? (
        <EmptyInbox recipientName={recipientName} canManage={canManage} shareHref={shareHref} />
      ) : (
        <div className="inbox-panes" data-pane={pane}>
          <div className="inbox-list-pane">
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Inbox"
              className="inbox-list"
              onKeyDown={onListKey}
            >
              {notes.map((note, i) => {
                const isSelected = note.id === selected?.id;
                const isUnread = !readIds.has(note.id);
                return (
                  <li
                    key={note.id}
                    role="option"
                    data-id={note.id}
                    aria-selected={isSelected}
                    aria-label={`${isUnread ? "Unread. " : ""}${note.authorName}: ${note.subject}, ${note.shortDate}`}
                    tabIndex={isSelected || (!selected && i === 0) ? 0 : -1}
                    className="inbox-row"
                    data-unread={isUnread || undefined}
                    onClick={() => openMessage(note.id)}
                  >
                    <span className="inbox-row-dot" aria-hidden />
                    <span className="inbox-row-from">{note.authorName}</span>
                    <span className="inbox-row-date">{note.shortDate}</span>
                    <span className="inbox-row-subject">{note.subject}</span>
                    <span className="inbox-row-preview">{note.preview}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="inbox-reader-pane">
            {selected ? (
              <Reader
                key={selected.id}
                readerRef={readerRef}
                note={selected}
                recipientName={recipientName}
                canManage={canManage}
                masterToken={masterToken}
                nextId={notes[index + 1]?.id ?? notes[index - 1]?.id ?? null}
                onRemoved={onRemoved}
              />
            ) : (
              <p className="inbox-reader-idle">Choose a message to read it.</p>
            )}
          </div>
        </div>
      )}
    </OsWindow>
  );
}

function Reader({
  readerRef,
  note,
  recipientName,
  canManage,
  masterToken,
  nextId,
  onRemoved,
}: {
  readerRef: RefObject<HTMLElement | null>;
  note: InboxNote;
  recipientName: string;
  canManage: boolean;
  masterToken: string;
  nextId: number | null;
  onRemoved: (nextId: number | null) => void;
}) {
  const subjectId = useId();
  return (
    <article ref={readerRef} tabIndex={-1} aria-labelledby={subjectId} className="inbox-reader">
      <header className="inbox-reader-head">
        <h3 id={subjectId} className="inbox-reader-subject">
          {note.subject}
        </h3>
        <dl className="inbox-reader-meta">
          <dt>From</dt>
          <dd>{note.authorName}</dd>
          <dt>To</dt>
          <dd>{recipientName}</dd>
          <dt>Date</dt>
          <dd>{note.date}</dd>
        </dl>
      </header>
      <div className="inbox-reader-body">
        <p>{note.body}</p>
        {note.image ? (
          <figure className="inbox-attachment">
            <figcaption>
              <PixelIcon name="card" />
              Photo from {note.authorName}
            </figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={note.image} alt={`Photo from ${note.authorName}`} />
          </figure>
        ) : null}
        {canManage ? (
          <RemoveNote
            masterToken={masterToken}
            note={note}
            nextId={nextId}
            onRemoved={onRemoved}
          />
        ) : null}
      </div>
    </article>
  );
}

function RemoveNote({
  masterToken,
  note,
  nextId,
  onRemoved,
}: {
  masterToken: string;
  note: InboxNote;
  nextId: number | null;
  onRemoved: (nextId: number | null) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const keepRef = useRef<HTMLButtonElement>(null);
  const askRef = useRef<HTMLButtonElement>(null);

  function ask() {
    flushSync(() => setConfirming(true));
    keepRef.current?.focus();
  }

  function keep() {
    flushSync(() => {
      setConfirming(false);
      setError(null);
    });
    askRef.current?.focus();
  }

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMessage(masterToken, note.id);
      if (result.ok) onRemoved(nextId);
      else setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <div className="inbox-remove">
        <button ref={askRef} type="button" className="os-button" data-variant="quiet" onClick={ask}>
          Remove this note
        </button>
        <span>Only the organizer link can do this.</span>
      </div>
    );
  }

  return (
    <div className="inbox-remove" data-confirming="true" role="group" aria-label="Confirm removal">
      <p>
        {error ??
          (isPending
            ? "Removing…"
            : `Remove ${note.authorName}’s note for good? It comes off the card too.`)}
      </p>
      <div className="inbox-remove-actions">
        <button type="button" className="os-button" onClick={confirmRemove} disabled={isPending}>
          Remove note
        </button>
        <button
          ref={keepRef}
          type="button"
          className="os-button"
          data-variant="quiet"
          onClick={keep}
          disabled={isPending}
        >
          Keep it
        </button>
      </div>
    </div>
  );
}

function EmptyInbox({
  recipientName,
  canManage,
  shareHref,
}: {
  recipientName: string;
  canManage: boolean;
  shareHref: string;
}) {
  return (
    <div className="inbox-empty">
      <PixelIcon name="mail" className="inbox-empty-icon" />
      {canManage ? (
        <>
          <p className="inbox-empty-title">No one has signed {recipientName}’s card yet.</p>
          <p>Send the signing link from Share links, and each note arrives here as a message.</p>
          <Link href={shareHref} className="os-button">
            Share links
          </Link>
        </>
      ) : (
        <>
          <p className="inbox-empty-title">No messages yet.</p>
          <p>When friends sign your card, each note arrives here as a message.</p>
        </>
      )}
    </div>
  );
}
