"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({
  value,
  label = "Copy",
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
      className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        state === "copied"
          ? "border-accent/40 bg-accent/10 text-accent-deep"
          : "border-foreground/20 bg-paper text-foreground hover:border-accent hover:text-accent"
      }`}
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : label}
    </button>
  );
}

/**
 * Shows the full shareable URL (origin resolved in the browser) alongside a
 * copy button. Renders the path alone until mounted so hydration stays stable.
 */
export function CopyLink({ path }: { path: string }) {
  const origin = useSyncExternalStore(
    subscribeToNothing,
    getOrigin,
    getServerOrigin,
  );

  const url = `${origin}${path}`;

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-foreground/12 bg-background/70 px-3.5 py-2.5 font-mono text-[13px] break-all text-foreground/75">
        {url}
      </code>
      <CopyButton value={url} />
    </div>
  );
}
