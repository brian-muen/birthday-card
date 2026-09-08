"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CopyButton } from "@/components/copy-button";

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function getCanShare() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare({ url: window.location.origin, title: "Card" });
    } catch {
      return true;
    }
  }
  return true;
}

export function ShareLink({
  path,
  copyLabel = "Copy link",
  shareLabel = "Share",
  shareTitle,
  shareText,
}: {
  path: string;
  copyLabel?: string;
  shareLabel?: string;
  shareTitle?: string;
  shareText?: string;
}) {
  const origin = useSyncExternalStore(
    subscribeToNothing,
    getOrigin,
    getServerOrigin,
  );
  const canShare = useSyncExternalStore(
    subscribeToNothing,
    getCanShare,
    () => false,
  );

  const url = `${origin}${path}`;
  const [showSelectable, setShowSelectable] = useState(false);
  const selectableRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSelectable) return;
    const field = selectableRef.current;
    if (!field) return;
    field.focus();
    field.select();
  }, [showSelectable, url]);

  async function share() {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShowSelectable(true);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3">
      {showSelectable ? (
        <input
          ref={selectableRef}
          readOnly
          value={url}
          aria-label="Shareable address"
          onFocus={(event) => event.currentTarget.select()}
          className="field min-w-0 flex-1 font-mono text-[0.8125rem]"
        />
      ) : (
        <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[0.8125rem] text-muted select-all">
          {url}
        </code>
      )}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {canShare ? (
          <button
            type="button"
            onClick={share}
            className="shrink-0 border border-ink/25 px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
          >
            {shareLabel}
          </button>
        ) : null}
        <CopyButton
          value={url}
          label={copyLabel}
          onFailed={() => setShowSelectable(true)}
        />
      </div>
      {showSelectable ? (
        <p className="basis-full text-[0.875rem] leading-relaxed text-muted">
          Couldn&apos;t copy automatically. Select the address and copy it.
        </p>
      ) : null}
    </div>
  );
}
