"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";
import { PenIcon } from "@/components/pen-icon";
import {
  DEFAULT_PEN,
  PENS,
  parsePen,
  penBodyClass,
  penClass,
  penIsLively,
  penVar,
  type PenId,
} from "@/lib/pen";
import { stockHex } from "@/lib/stock";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;
// The counter is noise until the limit is actually in reach.
const COUNTER_THRESHOLD = MAX_BODY_LENGTH * 0.75;
type Draft = { authorName: string; body: string; pen: PenId };
function draftKey(contributeToken: string) {
  return `birthday-card:draft:${contributeToken}`;
}

// The sheet grows as the message does, so nobody writes into a scrollbar.
function fitToContent(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export default function MessageForm({
  contributeToken,
  recipientName,
  stock,
}: {
  contributeToken: string;
  recipientName: string;
  stock: string;
}) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [pen, setPen] = useState<PenId>(DEFAULT_PEN);
  const [error, setError] = useState<string | null>(null);
  const [sentBy, setSentBy] = useState<string | null>(null);
  const [sentPen, setSentPen] = useState<PenId>(DEFAULT_PEN);
  const [pending, startTransition] = useTransition();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(draftKey(contributeToken));
        if (saved) {
          const draft = JSON.parse(saved) as Partial<Draft>;
          if (typeof draft.authorName === "string") setAuthorName(draft.authorName);
          if (typeof draft.body === "string") setBody(draft.body);
          if (typeof draft.pen === "string") setPen(parsePen(draft.pen));
        }
      } catch {
        // Storage can be unavailable; the form still works.
      }
      setDraftLoaded(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [contributeToken]);

  useEffect(() => {
    if (!draftLoaded || sentBy) return;
    try {
      window.localStorage.setItem(draftKey(contributeToken), JSON.stringify({ authorName, body, pen }));
    } catch { /* storage is optional */ }
  }, [authorName, body, contributeToken, draftLoaded, pen, sentBy]);

  useEffect(() => {
    if (bodyRef.current) fitToContent(bodyRef.current);
  }, [body]);

  useEffect(() => {
    if (sentBy) successRef.current?.focus();
  }, [sentBy]);

  function focusField(field: "name" | "body") {
    (field === "name" ? nameRef : bodyRef).current?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = authorName.trim();
    const message = body.trim();
    const chosen = parsePen(pen);

    if (!name) {
      setError("Sign your name at the bottom so they know who wrote it.");
      focusField("name");
      return;
    }
    if (!message) {
      setError("Write a message before adding it to the card.");
      focusField("body");
      return;
    }
    if (message.length > MAX_BODY_LENGTH) {
      setError(`Shorten your message to ${MAX_BODY_LENGTH} characters or fewer.`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addMessage({
        contributeToken,
        authorName: name,
        body: message,
        pen: chosen,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSentBy(name);
      setSentPen(chosen);
      setAuthorName("");
      setBody("");
      try { window.localStorage.removeItem(draftKey(contributeToken)); } catch { /* optional */ }
    });
  }

  if (sentBy) {
    return (
      <div className="mt-12 border-t border-rule pt-10">
        <h2 ref={successRef} tabIndex={-1} className="font-serif text-[1.75rem] leading-tight outline-none">
          Message added.
        </h2>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-muted">
          It&rsquo;s in {recipientName}&rsquo;s card now, signed{" "}
          <span className={`text-xl text-ink ${penClass(sentPen)}`}>
            {sentBy}
          </span>
          . Nobody
          else signing the card can read it. Only {recipientName} and the card organizer can read it; other contributors cannot see private notes.
        </p>
        <button
          type="button"
          onClick={() => setSentBy(null)}
          className="mt-6 text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12">
      <fieldset>
        <legend className="text-[0.9375rem] font-medium">Your pen</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {PENS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer flex-col items-center gap-1.5"
            >
              <input
                type="radio"
                name="pen"
                value={option.id}
                checked={pen === option.id}
                onChange={() => setPen(option.id)}
                className="peer sr-only"
              />
              <span className="flex size-12 items-center justify-center border border-rule bg-raised text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-checked:outline peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-ink">
                <PenIcon id={option.id} />
              </span>
              <span className="text-[0.75rem] text-muted">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* The page they're writing: message above, signature on the line. */}
      <div
        className="paper-surface paper-lift mt-8 border border-rule px-6 py-7 sm:px-9 sm:py-9"
        style={{
          backgroundColor: "var(--paper-liner, #fffdf8)",
          ["--card-stock" as string]: stockHex(stock),
          ["--card-face" as string]: penVar(pen),
        }}
      >
        <label htmlFor="body" className="sr-only">
          Your message for {recipientName}
        </label>
        <textarea
          ref={bodyRef}
          id="body"
          name="body"
          required
          rows={1}
          maxLength={MAX_BODY_LENGTH}
          placeholder="Write anything — a memory, an inside joke, something you've never got around to saying."
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            fitToContent(event.target);
          }}
          disabled={pending}
          className={`min-h-44 w-full resize-none border-0 bg-transparent leading-[1.6] outline-none placeholder:text-muted/45 font-card ${penBodyClass(pen)}`}
        />

        <div className="mt-8 flex items-end justify-between gap-6">
          <span className="pb-2 text-sm tabular-nums text-muted">
            {body.length > COUNTER_THRESHOLD
              ? `${MAX_BODY_LENGTH - body.length} characters left`
              : null}
          </span>

          <div className="w-full max-w-56">
            <label htmlFor="authorName" className="sr-only">
              Your name
            </label>
            <input
              ref={nameRef}
              id="authorName"
              name="authorName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              autoComplete="name"
              placeholder="Your name"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              disabled={pending}
              className={`field text-right font-card leading-tight placeholder:text-muted/70 ${
                penIsLively(pen) ? "text-[1.75rem]" : "text-[1.25rem]"
              }`}
            />
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed"
        >
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-7 py-3 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-[#121a31] disabled:cursor-not-allowed disabled:bg-muted"
        >
          {pending ? "Adding your message…" : "Add my message"}
        </button>
        <p className="max-w-[38ch] text-sm leading-relaxed text-muted">
          The recipient and organizer can read this note. It will be ready as soon as the card is shared.
        </p>
      </div>

      {(body.trim() || authorName.trim()) && (
        <aside aria-label="Preview of your note" className="paper-surface mt-10 border border-rule bg-[var(--paper-liner,#fffdf8)] px-6 py-6 sm:px-9">
          <p className="text-sm font-medium text-muted">Your note preview</p>
          <p className={`mt-4 whitespace-pre-wrap text-xl leading-[1.6] text-ink font-card ${penBodyClass(pen)}`}>
            {body || "Your message will appear here."}
          </p>
          <p className={`mt-5 text-right text-xl text-ink font-card ${penClass(pen)}`}>
            {authorName || "Your name"}
          </p>
        </aside>
      )}
    </form>
  );
}
