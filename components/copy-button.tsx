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
      className="shrink-0 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-600 hover:to-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-amber-50 px-4 py-3 font-mono text-sm break-all text-amber-950 ring-1 ring-amber-900/10">
        {url}
      </code>
      <CopyButton value={url} />
    </div>
  );
}
