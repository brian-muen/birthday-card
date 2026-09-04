"use client";

import { useState, useTransition } from "react";

import { deleteMessage } from "@/app/actions/delete-message";

export default function DeleteButton({
  masterToken,
  messageId,
  authorName,
}: {
  masterToken: string;
  messageId: number;
  authorName: string;
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
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs shadow-sm ring-1 ring-black/5 print:hidden">
        <span className="text-foreground/70">
          {error ?? (isPending ? "Deleting…" : "Really delete?")}
        </span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="rounded-full px-2 py-0.5 font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="rounded-full px-2 py-0.5 text-foreground/50 hover:bg-black/5 disabled:opacity-50"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete message from ${authorName}`}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-foreground/40 transition hover:bg-white/80 hover:text-foreground/80 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 print:hidden"
    >
      ×
    </button>
  );
}
