"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";
import ReplyInvitation from "@/components/mail/reply-invitation";
import ReplyPaper from "@/components/mail/reply-paper";
import ReplyPenPicker from "@/components/mail/reply-pen-picker";
import ReplySent from "@/components/mail/reply-sent";
import OsWindow from "@/components/os/os-window";
import { prepareNoteImage } from "@/lib/prepare-note-image";
import { DEFAULT_PEN, parsePen, type PenId } from "@/lib/pen";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;
const COUNTER_THRESHOLD = MAX_BODY_LENGTH * 0.75;
const WIDE_QUERY = "(min-width: 64rem)";

type Draft = { authorName: string; body: string; pen: PenId };
type ErrorField = "name" | "body" | "form";
type View = "inbox" | "compose" | "sent";
type DraftStatus = "none" | "restored" | "saved" | "unsaved";
type FocusTarget = "name" | "body" | "reply" | "sent";

const DRAFT_LABEL: Record<DraftStatus, string> = {
  none: "Drafts save as you type",
  restored: "Draft restored",
  saved: "Draft saved",
  unsaved: "This browser can't save drafts",
};

function draftKey(contributeToken: string) {
  return `birthday-card:draft:${contributeToken}`;
}

function counterLabel(length: number) {
  if (length <= COUNTER_THRESHOLD) return null;
  const left = MAX_BODY_LENGTH - length;
  if (left < 0) return `${-left} ${left === -1 ? "character" : "characters"} over the limit`;
  return `${left} ${left === 1 ? "character" : "characters"} left`;
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
      return true;
    }
    window.localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    // Private mode, quota, or blocked storage must not stop signing.
    return false;
  }
}

function clearDraft(contributeToken: string) {
  try {
    window.localStorage.removeItem(draftKey(contributeToken));
  } catch {
    // Clearing is best-effort.
  }
}

export default function MessageForm({
  contributeToken,
  recipientName,
  intro,
  received,
  stock,
}: {
  contributeToken: string;
  recipientName: string;
  intro: string | null;
  received: string;
  stock: string;
}) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [pen, setPen] = useState<PenId>(DEFAULT_PEN);
  const [image, setImage] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField | null>(null);
  const [view, setView] = useState<View>("inbox");
  const [sent, setSent] = useState<{ name: string; pen: PenId } | null>(null);
  const [replied, setReplied] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("none");
  const [preview, setPreview] = useState<boolean | null>(null);
  const [composeMotion, setComposeMotion] = useState(false);
  const [paperMotion, setPaperMotion] = useState(false);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLButtonElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const paperRef = useRef<HTMLElement>(null);
  const focusTarget = useRef<FocusTarget | null>(null);
  const scrollToPaper = useRef(false);

  const subject = `Sign ${recipientName}'s birthday card`;
  const showPreview = view === "compose" && preview === true;

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(draftKey(contributeToken));
        if (!saved) return;
        const draft = JSON.parse(saved) as Partial<Draft>;
        const name = typeof draft.authorName === "string" ? draft.authorName : "";
        const text = typeof draft.body === "string" ? draft.body : "";
        if (!name && !text) return;
        setAuthorName(name);
        setBody(text);
        if (typeof draft.pen === "string") setPen(parsePen(draft.pen));
        setDraftStatus("restored");
        setPreview(window.matchMedia(WIDE_QUERY).matches);
        setView("compose");
      } catch {
        // Storage can be unavailable; the form still works.
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, [contributeToken]);

  useEffect(() => {
    if (bodyRef.current) fitToContent(bodyRef.current);
  }, [body, view]);

  useLayoutEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = null;
    const element = {
      name: nameRef.current,
      body: bodyRef.current,
      reply: replyRef.current,
      sent: sentRef.current,
    }[target];
    element?.focus();
  }, [view]);

  useEffect(() => {
    if (!showPreview || !scrollToPaper.current) return;
    scrollToPaper.current = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paperRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [showPreview]);

  function saveDraft(next: Draft) {
    if (!next.authorName && !next.body) {
      clearDraft(contributeToken);
      setDraftStatus("none");
      return;
    }
    setDraftStatus(persistDraft(contributeToken, next) ? "saved" : "unsaved");
  }

  function clearError(field: ErrorField) {
    if (errorField !== field) return;
    setError(null);
    setErrorField(null);
  }

  function fail(message: string, field: ErrorField) {
    setError(message);
    setErrorField(field);
    if (field === "name") nameRef.current?.focus();
    if (field === "body") bodyRef.current?.focus();
  }

  function openReply() {
    setPreview((current) => current ?? window.matchMedia(WIDE_QUERY).matches);
    setComposeMotion(true);
    setPaperMotion(true);
    focusTarget.current = authorName.trim() ? "body" : "name";
    setView("compose");
  }

  function backToInbox() {
    focusTarget.current = "reply";
    setView("inbox");
  }

  function togglePreview() {
    const next = !showPreview;
    setPreview(next);
    setPaperMotion(true);
    if (next && !window.matchMedia(WIDE_QUERY).matches) scrollToPaper.current = true;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = authorName.trim();
    const message = body.trim();
    const chosen = parsePen(pen);

    if (!name) {
      fail("Add your name under Sign as, so they know who wrote it.", "name");
      return;
    }
    if (!message) {
      fail("Write your note before sending.", "body");
      return;
    }
    if (message.length > MAX_BODY_LENGTH) {
      fail(`Shorten your note to ${MAX_BODY_LENGTH} characters or fewer.`, "body");
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
          fail(`${result.error} Your note is still here, so you can send it again.`, "form");
          return;
        }

        clearDraft(contributeToken);
        setDraftStatus("none");
        setSent({ name, pen: chosen });
        setReplied(true);
        setAuthorName("");
        setBody("");
        setImage(null);
        focusTarget.current = "sent";
        setView("sent");
      } catch {
        fail("Your note couldn't be sent. It's still here, so you can try again.", "form");
      }
    });
  }

  function writeAnother() {
    setError(null);
    setErrorField(null);
    setAuthorName("");
    setBody("");
    setImage(null);
    setPen(DEFAULT_PEN);
    setComposeMotion(true);
    focusTarget.current = "name";
    setView("compose");
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
    clearError("form");
  }

  if (view === "sent" && sent) {
    return (
      <ReplySent
        recipientName={recipientName}
        authorName={sent.name}
        pen={sent.pen}
        headingRef={sentRef}
        onWriteAnother={writeAnother}
        onDone={backToInbox}
      />
    );
  }

  if (view === "inbox") {
    return (
      <ReplyInvitation
        recipientName={recipientName}
        intro={intro}
        received={received}
        hasDraft={Boolean(authorName || body)}
        replied={replied}
        replyRef={replyRef}
        onReply={openReply}
      />
    );
  }

  const busy = pending || imageBusy;
  const describedBy = error ? "reply-error" : undefined;

  return (
    <div className="reply-desk" data-preview={showPreview || undefined}>
      <form
        onSubmit={handleSubmit}
        aria-busy={pending}
        noValidate
        className="reply-form"
        data-animate={composeMotion || undefined}
      >
        <OsWindow
          title={`Re: ${subject}`}
          width="40rem"
          className="reply-window reply-compose"
          onClose={backToInbox}
          closeLabel="Close reply and keep the draft"
          toolbar={
            <>
              <button
                type="submit"
                className="os-button reply-send"
                data-variant="accent"
                disabled={busy}
              >
                {pending ? "Sending…" : "Send"}
              </button>
              <label className="os-button reply-attach">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void handlePhoto(file);
                  }}
                />
                {image ? "Replace photo" : "Attach photo"}
              </label>
              <button
                type="button"
                className="os-button reply-preview-toggle"
                aria-pressed={showPreview}
                onClick={togglePreview}
              >
                Preview<span className="reply-wide-only"> on paper</span>
              </button>
              {error ? (
                <p id="reply-error" role="alert" className="reply-error">
                  {error}
                </p>
              ) : null}
            </>
          }
          status={
            <>
              <span>{DRAFT_LABEL[draftStatus]}</span>
              <span className="reply-counter">{counterLabel(body.length)}</span>
            </>
          }
        >
          <div className="reply-fields">
            <span className="reply-label">To</span>
            <span className="reply-static">
              {recipientName}&apos;s birthday card
              <span className="reply-private">Private</span>
            </span>

            <label htmlFor="authorName" className="reply-label">
              Sign as
            </label>
            <input
              ref={nameRef}
              id="authorName"
              name="authorName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              autoComplete="name"
              placeholder="Your name, as you sign it"
              value={authorName}
              onChange={(event) => {
                const value = event.target.value;
                setAuthorName(value);
                saveDraft({ authorName: value, body, pen });
                clearError("name");
              }}
              disabled={pending}
              aria-invalid={errorField === "name"}
              aria-describedby={describedBy}
              className="os-field reply-name"
            />

            <span className="reply-label">Subject</span>
            <span className="reply-static">Re: {subject}</span>
          </div>

          <ReplyPenPicker
            pen={pen}
            sample={authorName.trim().split(/\s+/)[0] || "Your name"}
            disabled={pending}
            onChange={(next) => {
              setPen(next);
              saveDraft({ authorName, body, pen: next });
            }}
          />

          <label htmlFor="body" className="sr-only">
            Your note for {recipientName}
          </label>
          <textarea
            ref={bodyRef}
            id="body"
            name="body"
            required
            rows={1}
            maxLength={MAX_BODY_LENGTH}
            placeholder={`Write your note to ${recipientName}. A memory, an inside joke, something you've never got around to saying.`}
            value={body}
            onChange={(event) => {
              const value = event.target.value;
              setBody(value);
              saveDraft({ authorName, body: value, pen });
              clearError("body");
              fitToContent(event.target);
            }}
            disabled={pending}
            aria-invalid={errorField === "body"}
            aria-describedby={describedBy}
            className="reply-body"
          />

          {image ? (
            <div className="reply-attachment">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL */}
              <img src={image} alt="Your attached photo" />
              <span className="reply-attachment-text">
                <strong>Photo attached</strong>
                <span>It goes above your note on the card.</span>
              </span>
              <button
                type="button"
                className="os-button"
                data-variant="quiet"
                onClick={() => setImage(null)}
                disabled={busy}
              >
                Remove photo
              </button>
            </div>
          ) : imageBusy ? (
            <p className="reply-attachment" role="status">
              Preparing photo…
            </p>
          ) : null}
        </OsWindow>
      </form>

      {showPreview ? (
        <ReplyPaper
          recipientName={recipientName}
          stock={stock}
          body={body}
          authorName={authorName}
          pen={pen}
          image={image}
          animate={paperMotion}
          paperRef={paperRef}
        />
      ) : null}

      {pending ? (
        <p className="sr-only" role="status">
          Sending your note
        </p>
      ) : null}
    </div>
  );
}
