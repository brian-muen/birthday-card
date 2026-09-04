"use client";

import { useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-background/60 px-3.5 py-2.5 text-base outline-none transition placeholder:text-foreground/30 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

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
      setError("Please add your name so they know who it's from.");
      return;
    }
    if (!message) {
      setError("Please write a message before sending.");
      return;
    }
    if (message.length > MAX_BODY_LENGTH) {
      setError(`Please keep your message under ${MAX_BODY_LENGTH} characters.`);
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
      <div className="shadow-card rounded-2xl border border-foreground/10 bg-paper p-8 text-center sm:p-10">
        <p aria-hidden className="font-serif text-3xl text-accent">
          &#10047;
        </p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight sm:text-3xl">
          Thank you, {sentBy}.
        </h2>
        <p className="mt-3 leading-relaxed text-foreground/60">
          Your message has been added to {recipientName}&rsquo;s card.
        </p>
        <button
          type="button"
          onClick={() => setSentBy(null)}
          className="mt-6 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 transition hover:decoration-accent"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shadow-card rounded-2xl border border-foreground/10 bg-paper p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="authorName"
            className="text-sm font-medium text-foreground/80"
          >
            Your name
          </label>
          <input
            id="authorName"
            name="authorName"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            placeholder="Jamie"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            disabled={pending}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="body"
              className="text-sm font-medium text-foreground/80"
            >
              Your message
            </label>
            <span
              className={`text-xs tabular-nums ${
                body.length > MAX_BODY_LENGTH * 0.95
                  ? "text-accent"
                  : "text-foreground/40"
              }`}
            >
              {body.length}/{MAX_BODY_LENGTH}
            </span>
          </div>
          <textarea
            id="body"
            name="body"
            required
            rows={7}
            maxLength={MAX_BODY_LENGTH}
            placeholder={`Share a favorite memory, an inside joke, or a warm wish for ${recipientName}...`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={pending}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-accent/25 bg-accent/5 px-3.5 py-2.5 text-sm text-accent-deep"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending..." : "Add my message"}
        </button>
      </div>
    </form>
  );
}
