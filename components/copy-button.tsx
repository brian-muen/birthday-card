"use client";

import { useEffect, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({
  value,
  label = "Copy link",
  onFailed,
}: {
  value: string;
  label?: string;
  onFailed?: () => void;
}) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
      onFailed?.();
    }
  }

  const caption =
    state === "copied"
      ? "Link copied"
      : state === "failed"
        ? "Couldn't copy"
        : label;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={caption}
      aria-live="polite"
      className="ui-button shrink-0"
      data-copied={state === "copied"}
    >
      <span className="ui-button-swap" aria-hidden="true">
        <span data-visible={state === "idle" ? "true" : undefined}>{label}</span>
        <span data-visible={state === "copied" ? "true" : undefined}>
          Link copied
        </span>
        <span data-visible={state === "failed" ? "true" : undefined}>
          Couldn&apos;t copy
        </span>
      </span>
    </button>
  );
}
