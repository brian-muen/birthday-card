"use client";

import { useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;
// The counter is noise until the limit is actually in reach.
const COUNTER_THRESHOLD = MAX_BODY_LENGTH * 0.75;

// The sheet grows as the message does, so nobody writes into a scrollbar.
function fitToContent(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export default function MessageForm({
  contributeToken,
  recipientName,
}: {
  contributeToken: string;
  recipientName: string;
}) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentBy, setSentBy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = authorName.trim();
    const message = body.trim();

    if (!name) {
      setError("Sign your name at the bottom of the page so they know who wrote it.");
      return;
    }
    if (!message) {
      setError("Write a message before adding it to the card.");
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
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSentBy(name);
      setAuthorName("");
      setBody("");
    });
  }

  if (sentBy) {
    return (
      <div className="mt-12 border-t border-rule pt-10">
        <h2 className="font-serif text-[1.75rem] leading-tight">
          Message added.
        </h2>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-muted">
          It&rsquo;s a page in {recipientName}&rsquo;s card now, signed{" "}
          <span className="font-hand text-xl text-ink">{sentBy}</span>. Nobody
          else signing the card can read it.
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
      {/* The page they're writing: message above, signature on the line. */}
      <div className="paper-lift border border-rule bg-raised px-6 py-7 transition-colors focus-within:border-ink sm:px-9 sm:py-9">
        <label htmlFor="body" className="sr-only">
          Your message for {recipientName}
        </label>
        <textarea
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
          className="min-h-44 w-full resize-none border-0 bg-transparent font-serif text-xl leading-[1.6] outline-none placeholder:text-muted/45"
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
              className="field text-right font-hand text-[1.75rem] leading-tight placeholder:text-muted/70"
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
        <p className="text-sm leading-relaxed text-muted">
          Only {recipientName} sees this, on their birthday.
        </p>
      </div>
    </form>
  );
}
