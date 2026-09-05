"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
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
          ? "Press ⌘C to copy"
          : label}
    </button>
  );
}

/**
 * Shows the full shareable URL (origin resolved in the browser) on a ruled
 * line with its copy action. Renders the path alone until mounted so
 * hydration stays stable.
 */
export function CopyLink({ path }: { path: string }) {
  const origin = useSyncExternalStore(
    subscribeToNothing,
    getOrigin,
    getServerOrigin,
  );

  const url = `${origin}${path}`;

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <code className="min-w-0 overflow-x-auto font-mono text-[0.8125rem] text-muted">
        {url}
      </code>
      <CopyButton value={url} />
    </div>
  );
}
