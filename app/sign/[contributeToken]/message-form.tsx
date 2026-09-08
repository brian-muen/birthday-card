"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";
import MessageReader from "@/components/message-reader";
import { PenIcon } from "@/components/pen-icon";
import {
  DEFAULT_PEN,
  PENS,
  parsePen,
  penBodyClass,
  penSignatureClass,
  penVar,
  type PenId,
} from "@/lib/pen";
import { stockHex } from "@/lib/stock";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;
const COUNTER_THRESHOLD = MAX_BODY_LENGTH * 0.75;
const LINER = "var(--paper-liner, #fffdf8)";
const WRITING_INK = "var(--ink-pen, #2a241c)";
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='fiber'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23fiber)'/></svg>\")";

type Draft = { authorName: string; body: string; pen: PenId };
type ErrorField = "name" | "body" | "form";

function draftKey(contributeToken: string) {
  return `birthday-card:draft:${contributeToken}`;
}

function fitToContent(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function persistDraft(contributeToken: string, draft: Draft) {
  try {
    const key = draftKey(contributeToken);
    if (!draft.authorName && !draft.body) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Private mode, quota, or blocked storage must not stop signing.
  }
}

function clearDraft(contributeToken: string) {
  try {
    window.localStorage.removeItem(draftKey(contributeToken));
  } catch {
    // Clearing is best-effort.
  }
}

function PaperSheet({
  children,
  stock,
  className,
}: {
  children: React.ReactNode;
  stock: string;
  className?: string;
}) {
  return (
    <div
      className={`signing-sheet relative isolate overflow-hidden ${className ?? ""}`}
      style={{
        backgroundColor: LINER,
        ["--card-stock" as string]: stockHex(stock),
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.72), inset 0 -1px 0 rgb(27 36 64 / 0.04), 0 0 0 1px rgb(27 36 64 / 0.08)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[5px]"
        style={{ backgroundColor: "var(--card-stock)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
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
  const [errorField, setErrorField] = useState<ErrorField | null>(null);
  const [sentBy, setSentBy] = useState<string | null>(null);
  const [sentPen, setSentPen] = useState<PenId>(DEFAULT_PEN);
  const [pending, startTransition] = useTransition();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const returnToFormRef = useRef(false);

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
    persistDraft(contributeToken, { authorName, body, pen });
  }, [authorName, body, contributeToken, draftLoaded, pen, sentBy]);

  useEffect(() => {
    if (bodyRef.current) fitToContent(bodyRef.current);
  }, [body]);

  useLayoutEffect(() => {
    if (sentBy) {
      successRef.current?.focus();
      return;
    }
    if (returnToFormRef.current) {
      returnToFormRef.current = false;
      bodyRef.current?.focus();
    }
  }, [sentBy]);

  function focusField(field: "name" | "body") {
    (field === "name" ? nameRef : bodyRef).current?.focus();
  }

  function fail(message: string, field: ErrorField) {
    setError(message);
    setErrorField(field);
    if (field === "name" || field === "body") focusField(field);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = authorName.trim();
    const message = body.trim();
    const chosen = parsePen(pen);

    if (!name) {
      fail("Sign your name so they know who wrote it.", "name");
      return;
    }
    if (!message) {
      fail("Write a message before adding it to the card.", "body");
      return;
    }
    if (message.length > MAX_BODY_LENGTH) {
      fail(`Shorten your message to ${MAX_BODY_LENGTH} characters or fewer.`, "body");
      return;
    }

    setError(null);
    setErrorField(null);
    startTransition(async () => {
      try {
        const result = await addMessage({
          contributeToken,
          authorName: name,
          body: message,
          pen: chosen,
        });

        if (!result.ok) {
          fail(
            `${result.error} Your words are still here — try adding the note again.`,
            "form",
          );
          return;
        }

        clearDraft(contributeToken);
        setSentBy(name);
        setSentPen(chosen);
        setAuthorName("");
        setBody("");
      } catch {
        fail("The note could not be added. Your words are still here — try again.", "form");
      }
    });
  }

  function writeAnother() {
    returnToFormRef.current = true;
    setSentBy(null);
    setSentPen(DEFAULT_PEN);
    setError(null);
    setErrorField(null);
    setAuthorName("");
    setBody("");
    setPen(DEFAULT_PEN);
  }

  if (sentBy) {
    return (
      <section
        className="mt-12 max-w-2xl border-t border-rule pt-10"
        aria-labelledby="signing-success"
      >
        <h2
          id="signing-success"
          ref={successRef}
          tabIndex={-1}
          className="font-serif text-[1.75rem] leading-tight outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Your note is in the card.
        </h2>
        <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
          It is signed{" "}
          <span
            className={`text-[color:var(--ink-pen,var(--ink))] ${penSignatureClass(sentPen)}`}
            style={{ ["--card-face" as string]: penVar(sentPen) }}
          >
            {sentBy}
          </span>
          . Only {recipientName} and the organizer can read it. Other people
          signing cannot. Nothing waits for a birthday send — the organizer
          delivers the card by sharing the recipient link.
        </p>
        <button
          type="button"
          onClick={writeAnother}
          className="mt-6 text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Write another message
        </button>
      </section>
    );
  }

  const previewBody = body.trim() || "Your message will appear here.";
  const previewName = authorName.trim() || "Your name";

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="mt-10"
    >
      <fieldset className="max-w-2xl">
        <legend className="text-[0.9375rem] font-medium">Your pen</legend>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
          {PENS.map((option) => {
            const selected = pen === option.id;
            return (
              <label
                key={option.id}
                className="flex cursor-pointer flex-col items-center gap-1.5"
              >
                <input
                  type="radio"
                  name="pen"
                  value={option.id}
                  checked={selected}
                  onChange={() => setPen(option.id)}
                  className="peer sr-only"
                />
                <span
                  className={`flex size-11 items-center justify-center border bg-transparent text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
                    selected
                      ? "border-ink"
                      : "border-rule text-muted"
                  }`}
                >
                  <PenIcon id={option.id} />
                </span>
                <span
                  className={`text-[0.75rem] ${
                    selected
                      ? "text-ink underline decoration-rule decoration-1 underline-offset-4"
                      : "text-muted"
                  }`}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,32rem)_minmax(16rem,22rem)]">
        <PaperSheet
          stock={stock}
          className="px-6 py-7 pl-8 sm:px-9 sm:py-9 sm:pl-10 focus-within:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.72),0_0_0_1px_var(--ink)]"
        >
          <div
            style={{
              ["--card-face" as string]: penVar(pen),
              color: WRITING_INK,
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
                if (errorField === "body") {
                  setError(null);
                  setErrorField(null);
                }
                fitToContent(event.target);
              }}
              disabled={pending}
              aria-invalid={errorField === "body"}
              aria-describedby={error ? "signing-error" : undefined}
              className={`min-h-44 w-full resize-none border-0 bg-transparent outline-none placeholder:text-muted/45 font-card disabled:cursor-not-allowed disabled:opacity-60 ${penBodyClass(pen)}`}
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
                  onChange={(event) => {
                    setAuthorName(event.target.value);
                    if (errorField === "name") {
                      setError(null);
                      setErrorField(null);
                    }
                  }}
                  disabled={pending}
                  aria-invalid={errorField === "name"}
                  aria-describedby={error ? "signing-error" : undefined}
                  className={`w-full border-0 border-b border-rule bg-transparent py-2 text-right font-card outline-none placeholder:text-muted/70 focus:border-b-2 focus:border-ink focus:pb-[7px] disabled:cursor-not-allowed disabled:text-muted ${penSignatureClass(pen)}`}
                />
              </div>
            </div>
          </div>
        </PaperSheet>

        <aside
          aria-label="Preview of your note"
          className="lg:sticky lg:top-8"
        >
          <p className="text-[0.8125rem] text-muted">
            How your note will look on the card
          </p>
          <PaperSheet stock={stock} className="mt-3 px-6 py-6 pl-8 sm:px-7">
            <div
              style={{
                ["--card-face" as string]: penVar(pen),
                color: WRITING_INK,
              }}
            >
              <MessageReader
                body={previewBody}
                authorName={previewName}
                pen={pen}
              />
            </div>
          </PaperSheet>
        </aside>
      </div>

      {pending ? (
        <p className="sr-only" role="status">
          Adding your message
        </p>
      ) : null}

      {error ? (
        <p
          id="signing-error"
          role="alert"
          className="mt-6 max-w-2xl border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-7 py-3 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-[#121a31] disabled:cursor-not-allowed disabled:bg-muted"
        >
          {pending ? "Adding your message…" : "Add my message"}
        </button>
        <p className="max-w-[40ch] text-sm leading-relaxed text-muted">
          Only {recipientName} and the organizer will see this note. Delivery
          is when they share the recipient link.
        </p>
      </div>
    </form>
  );
}
