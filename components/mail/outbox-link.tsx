"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getCanShare = () => typeof navigator.share === "function";

export default function OutboxLink({
  path,
  label,
  openLabel,
  shareTitle,
  shareText,
}: {
  path: string;
  label: string;
  openLabel: string;
  shareTitle: string;
  shareText: string;
}) {
  const id = useId();
  const origin = useSyncExternalStore(subscribeToNothing, getOrigin, () => "");
  const canShare = useSyncExternalStore(subscribeToNothing, getCanShare, () => false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const url = `${origin}${path}`;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function fallBack() {
    setFailed(true);
    fieldRef.current?.select();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
    } catch {
      fallBack();
    }
  }

  async function share() {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      fallBack();
    }
  }

  return (
    <div className="outbox-link">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={fieldRef}
        id={id}
        readOnly
        value={url}
        className="os-field outbox-address"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="outbox-link-actions">
        <button
          type="button"
          className="os-button outbox-copy"
          onClick={copy}
          data-copied={copied || undefined}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare ? (
          <button type="button" className="os-button" onClick={share}>
            Share
          </button>
        ) : null}
        <Link href={path} className="os-button" data-variant="quiet" aria-label={openLabel}>
          Open
        </Link>
      </div>
      <p className={failed ? "outbox-link-status" : "sr-only"} aria-live="polite">
        {copied
          ? "Link copied."
          : failed
            ? "Couldn’t copy automatically. The address is selected, so copy it from there."
            : ""}
      </p>
    </div>
  );
}
