"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteMessage } from "@/app/actions/delete-message";

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
};

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
    <div className="flex flex-col items-center">
      {/* The book: stacked pages behind the current one */}
      <div className="relative w-full">
        <span
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-2 rounded-md border border-foreground/10 bg-white"
        />
        <span
          aria-hidden
          className="absolute inset-0 translate-x-1 translate-y-1 rounded-md border border-foreground/10 bg-white"
        />

        <div
          key={index}
          className={`relative flex min-h-[26rem] w-full flex-col rounded-md border border-foreground/15 bg-white px-8 py-10 sm:min-h-[30rem] sm:px-14 sm:py-12 ${
            direction === "forward"
              ? "animate-page-in"
              : "animate-page-in-back"
          }`}
        >
          {/* Bound-edge detail */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-5 left-5 w-px bg-foreground/8 sm:left-8"
          />

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
              messageCount={notes.length}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Card pages"
        className="mt-7 flex w-full items-center justify-between px-1"
      >
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="text-sm font-medium text-foreground/70 underline-offset-4 transition hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-0"
        >
          &larr; Previous
        </button>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/45">
          {index === 0 ? "Cover" : `Page ${index} of ${notes.length}`}
        </p>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= pageCount - 1}
          className="text-sm font-medium text-foreground/70 underline-offset-4 transition hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-0"
        >
          Next &rarr;
        </button>
      </nav>
    </div>
  );
}

function CoverPage({
  recipientName,
  intro,
  messageCount,
}: {
  recipientName: string;
  intro: string | null;
  messageCount: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/45">
        A birthday card
      </p>
      <h1 className="mt-6 font-serif text-4xl leading-[1.15] tracking-tight text-balance sm:text-5xl">
        Happy Birthday,
        <br />
        <em>{recipientName}</em>
      </h1>

      <span aria-hidden className="mt-8 h-px w-16 bg-foreground/20" />

      {intro ? (
        <p className="mt-8 max-w-md font-serif text-lg italic leading-relaxed text-foreground/65 whitespace-pre-wrap">
          {intro}
        </p>
      ) : null}

      <p className="mt-8 text-sm text-foreground/50">
        {messageCount === 0
          ? "No messages yet — share the contributor link and they'll appear here."
          : messageCount === 1
            ? "One message inside. Turn the page."
            : `${messageCount} messages inside. Turn the page.`}
      </p>
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
      <p className="text-center font-serif text-sm italic text-foreground/35">
        {pageNumber} of {pageTotal}
      </p>

      <div className="flex flex-1 items-center py-8">
        <p className="w-full font-serif text-xl leading-relaxed text-foreground/90 whitespace-pre-wrap break-words sm:text-2xl">
          {note.body}
        </p>
      </div>

      <footer className="flex items-end justify-between gap-4">
        <RemoveControl masterToken={masterToken} messageId={note.id} />
        <div className="text-right">
          <p className="font-serif text-lg italic">&mdash; {note.authorName}</p>
          <p className="mt-1 text-xs text-foreground/40">{note.date}</p>
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
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <span>{error ?? (isPending ? "Removing…" : "Remove this page?")}</span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="font-medium underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground disabled:opacity-50"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-foreground/35 underline decoration-foreground/20 underline-offset-2 transition hover:text-foreground/70 hover:decoration-foreground/50"
    >
      Remove
    </button>
  );
}
