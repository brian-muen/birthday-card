"use client";

import { useState, useTransition } from "react";
import { addMessage } from "@/app/actions/add-message";

const MAX_NAME_LENGTH = 80;
const MAX_BODY_LENGTH = 2000;

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
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-2xl">
          🎉
        </div>
        <h2 className="mt-5 text-xl font-semibold sm:text-2xl">
          Thanks, {sentBy}!
        </h2>
        <p className="mt-2 text-stone-600">
          Your message has been added to {recipientName}&rsquo;s card.
        </p>
        <button
          type="button"
          onClick={() => setSentBy(null)}
          className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-semibold tracking-wide"
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
            className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-base outline-none transition placeholder:text-stone-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="body"
              className="block text-sm font-semibold tracking-wide"
            >
              Your message
            </label>
            <span
              className={`text-xs tabular-nums ${
                body.length > MAX_BODY_LENGTH * 0.95
                  ? "text-rose-600"
                  : "text-stone-400"
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
            className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-base leading-relaxed outline-none transition placeholder:text-stone-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-rose-500/20 transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Sending..." : "Add my message"}
        </button>
      </div>
    </form>
  );
}
