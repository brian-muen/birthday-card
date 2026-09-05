"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteMessage } from "@/app/actions/delete-message";

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
};

// Real signatures never line up. Derive a stable tilt from the name so each
// one sits at its own angle without changing on every render.
function tiltFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  }
  return ((hash % 9) - 4) / 2;
}

export default function CardBook({
  masterToken,
  recipientName,
  intro,
  notes,
}: {
  masterToken: string;
  recipientName: string;
  intro: string | null;
  notes: Note[];
}) {
  // Page 0 is the cover; each message is its own page after that.
  const pageCount = notes.length + 1;

  const [rawIndex, setRawIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Clamp in case a deletion removed the last page out from under us.
  const index = Math.min(rawIndex, pageCount - 1);

  function goTo(next: number) {
    if (next < 0 || next > pageCount - 1) return;
    setDirection(next > index ? "forward" : "back");
    setRawIndex(next);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, pageCount]);

  const note = index > 0 ? notes[index - 1] : null;

  return (
    <div>
      {/* The book: two sheets behind the page being read. */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 translate-x-[6px] translate-y-[6px] border border-rule bg-raised"
        />
        <span
          aria-hidden
          className="absolute inset-0 translate-x-[3px] translate-y-[3px] border border-rule bg-raised"
        />

        <div
          key={index}
          className={`paper-lift relative flex min-h-[27rem] flex-col border border-rule bg-raised px-7 py-9 sm:min-h-[32rem] sm:px-14 sm:py-12 ${
            direction === "forward" ? "animate-page-in" : "animate-page-in-back"
          }`}
        >
          {note ? (
            <MessagePage
              masterToken={masterToken}
              note={note}
              pageNumber={index}
              pageTotal={notes.length}
            />
          ) : (
            <CoverPage
              recipientName={recipientName}
              intro={intro}
              notes={notes}
            />
          )}
        </div>
      </div>

      <nav
        aria-label="Card pages"
        className="mt-8 flex items-center justify-between gap-6"
      >
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass disabled:pointer-events-none disabled:opacity-0"
        >
          Previous page
        </button>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= pageCount - 1}
          className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass disabled:pointer-events-none disabled:opacity-0"
        >
          {index === 0 ? "Read the messages" : "Next page"}
        </button>
      </nav>
    </div>
  );
}

function CoverPage({
  recipientName,
  intro,
  notes,
}: {
  recipientName: string;
  intro: string | null;
  notes: Note[];
}) {
  // One signature per person, in the order they signed.
  const signers = Array.from(new Set(notes.map((note) => note.authorName)));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <p className="font-serif text-xl text-muted">Happy birthday,</p>
        {/* Fluid so a long name shrinks instead of breaking the page. */}
        <h1 className="mt-1 font-serif text-[clamp(2.5rem,9vw,5rem)] leading-[0.98] tracking-[-0.025em] break-words">
          {recipientName}
        </h1>

        {intro ? (
          <p className="mt-8 max-w-[46ch] font-serif text-xl leading-[1.6] whitespace-pre-wrap">
            {intro}
          </p>
        ) : null}
      </div>

      {signers.length > 0 ? (
        <div className="mt-12">
          <p className="text-[0.9375rem] text-muted">
            {notes.length === 1
              ? "One message inside, from"
              : `${notes.length} messages inside, from`}
          </p>
          <ul className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-4">
            {signers.map((name) => (
              <li
                key={name}
                className="font-hand text-[1.875rem] leading-none text-ink/85"
                style={{ transform: `rotate(${tiltFor(name)}deg)` }}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-12 max-w-[48ch] leading-relaxed text-muted">
          No messages yet. Share the signing link and each one will appear here
          as a page of the card.
        </p>
      )}
    </div>
  );
}

function MessagePage({
  masterToken,
  note,
  pageNumber,
  pageTotal,
}: {
  masterToken: string;
  note: Note;
  pageNumber: number;
  pageTotal: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="text-center text-[0.8125rem] tabular-nums text-brass">
        {pageNumber} / {pageTotal}
      </p>

      <div className="flex flex-1 items-center py-10">
        <p className="w-full max-w-[52ch] font-serif text-[1.375rem] leading-[1.65] whitespace-pre-wrap break-words sm:text-[1.5rem]">
          {note.body}
        </p>
      </div>

      <footer className="flex items-end justify-between gap-6">
        <RemoveControl masterToken={masterToken} messageId={note.id} />
        <div className="text-right">
          <p
            className="font-hand text-[2rem] leading-none"
            style={{ transform: `rotate(${tiltFor(note.authorName)}deg)` }}
          >
            {note.authorName}
          </p>
          <p className="mt-2.5 text-[0.8125rem] text-muted">{note.date}</p>
        </div>
      </footer>
    </div>
  );
}

function RemoveControl({
  masterToken,
  messageId,
}: {
  masterToken: string;
  messageId: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMessage(masterToken, messageId);
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted">
        <span>
          {error ?? (isPending ? "Removing…" : "Remove this page for good?")}
        </span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="font-medium text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-brass disabled:opacity-50"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="underline decoration-rule decoration-2 underline-offset-4 hover:decoration-brass disabled:opacity-50"
        >
          Keep it
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[0.8125rem] text-muted underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brass"
    >
      Remove this page
    </button>
  );
}
