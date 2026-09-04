"use client";

import { useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;

const inputClass =
  "w-full rounded-md border border-foreground/20 bg-white px-3.5 py-2.5 text-base outline-none transition placeholder:text-foreground/30 focus:border-foreground/60 disabled:opacity-60";

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
      <div className="rounded-lg border border-foreground/12 bg-white p-8 text-center sm:p-10">
        <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Thank you, {sentBy}.
        </h2>
        <p className="mt-3 leading-relaxed text-foreground/60">
          Your message has been added to {recipientName}&rsquo;s card.
        </p>
        <button
          type="button"
          onClick={() => setSentBy(null)}
          className="mt-6 text-sm font-medium underline decoration-foreground/30 underline-offset-4 transition hover:decoration-foreground"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-foreground/12 bg-white p-6 sm:p-8"
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
                  ? "text-foreground"
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
            className="border-l-2 border-foreground/60 pl-3 text-sm text-foreground/80"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-6 py-3 text-base font-medium text-background transition hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending..." : "Add my message"}
        </button>
      </div>
    </form>
  );
}
