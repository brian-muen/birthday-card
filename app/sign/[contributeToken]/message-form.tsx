"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";
import MessageReader from "@/components/message-reader";
import { prepareNoteImage } from "@/lib/prepare-note-image";
import { PenIcon } from "@/components/pen-icon";
import {
  DEFAULT_PEN,
  PENS,
  parsePen,
  penBodyClass,
  penBodyVar,
  penSignatureClass,
  penVar,
  type PenId,
} from "@/lib/pen";
import { stockHex } from "@/lib/stock";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;
const COUNTER_THRESHOLD = MAX_BODY_LENGTH * 0.75;

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
      className={`signing-sheet paper-surface relative isolate overflow-hidden ${className ?? ""}`}
      style={{
        ["--card-stock" as string]: stockHex(stock),
      }}
    >
      <span aria-hidden="true" className="signing-sheet-spine" />
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
  const [image, setImage] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
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
          image,
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
        setImage(null);
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
    setImage(null);
    setPen(DEFAULT_PEN);
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setImageBusy(true);
    const result = await prepareNoteImage(file);
    setImageBusy(false);
    if (!result.ok) {
      fail(result.error, "form");
      return;
    }
    setImage(result.dataUrl);
    if (errorField === "form") {
      setError(null);
      setErrorField(null);
    }
  }

  if (sentBy) {
    return (
      <section className="signing-success" aria-labelledby="signing-success">
        <h2 id="signing-success" ref={successRef} tabIndex={-1}>
          Your note is in the card.
        </h2>
        <p>
          It is signed{" "}
          <span
            className={`font-card ${penSignatureClass(sentPen)}`}
            style={{ ["--card-face" as string]: penVar(sentPen) }}
          >
            {sentBy}
          </span>
          . Only {recipientName} and the organizer can read it. It reaches them
          when the organizer shares the card.
        </p>
        <button type="button" onClick={writeAnother} className="ui-button">
          Write another message
        </button>
      </section>
    );
  }

  const previewBody = body.trim() || "Your message will appear here.";
  const previewName = authorName.trim() || "Your name";
  const inkStyle = { ["--card-face" as string]: penBodyVar(pen) };

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} className="signing-form">
      <fieldset className="signing-pens">
        <legend>Choose a pen</legend>
        <div className="signing-pen-tray">
          {PENS.map((option) => (
            <label key={option.id} className="pen-choice">
              <input
                type="radio"
                name="pen"
                value={option.id}
                checked={pen === option.id}
                onChange={() => setPen(option.id)}
                className="sr-only"
              />
              <span className="pen-choice-mark">
                <PenIcon id={option.id} />
              </span>
              <span className="pen-choice-label">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="signing-workspace">
        <PaperSheet stock={stock} className="signing-write">
          <div className="signing-ink" data-pen={pen} style={inkStyle}>
            <div className="signing-photo">
              {image ? (
                <div>
                  <img src={image} alt="" className="note-photo note-photo-pick" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    disabled={pending || imageBusy}
                    className="quiet-link text-[0.8125rem] text-muted"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <label className="quiet-link signing-photo-control inline-flex text-[0.8125rem] text-muted">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="sr-only"
                    disabled={pending || imageBusy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void handlePhoto(file);
                    }}
                  />
                  {imageBusy ? "Preparing photo…" : "Add a photo"}
                </label>
              )}
            </div>

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
              className={`font-card ${penBodyClass(pen)}`}
            />

            <div className="signing-signoff">
              <span className="signing-counter">
                {body.length > COUNTER_THRESHOLD
                  ? `${MAX_BODY_LENGTH - body.length} characters left`
                  : null}
              </span>

              <div className="signing-name">
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
                  className={`font-card ${penSignatureClass(pen)}`}
                  style={{ ["--card-face" as string]: penVar(pen) }}
                />
              </div>
            </div>
          </div>
        </PaperSheet>

        <aside className="signing-preview" aria-label="Preview of your note">
          <p className="signing-preview-label">How your note will look in the card</p>
          <PaperSheet stock={stock} className="note-preview">
            <div className="signing-ink" data-pen={pen} style={inkStyle}>
              <MessageReader
                body={previewBody}
                authorName={previewName}
                pen={pen}
                image={image}
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
        <p id="signing-error" role="alert" className="signing-error">
          {error}
        </p>
      ) : null}

      <div className="signing-submit">
        <button
          type="submit"
          disabled={pending || imageBusy}
          className="ui-button ui-button-primary"
        >
          {pending ? "Adding your message…" : "Add my message"}
        </button>
        <p>
          Only {recipientName} and the organizer will see this. They read it
          when the organizer shares the card.
        </p>
      </div>
    </form>
  );
}
