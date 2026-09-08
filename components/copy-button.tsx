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

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`shrink-0 border px-4 py-2 text-sm font-medium transition-colors ${
        state === "copied"
          ? "border-brass text-brass"
          : "border-ink/25 hover:border-ink"
      }`}
    >
      {state === "copied"
        ? "Link copied"
        : state === "failed"
          ? "Couldn't copy"
          : label}
    </button>
  );
}
