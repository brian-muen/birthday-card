"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";

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

function selectNode(node: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function ShareLink({
  path,
  copyLabel = "Copy",
  shareLabel = "Share",
  openHref,
  openLabel = "Open",
  shareTitle,
  shareText,
}: {
  path: string;
  copyLabel?: string;
  shareLabel?: string;
  openHref?: string;
  openLabel?: string;
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
  const [copyFailed, setCopyFailed] = useState(false);
  const addressRef = useRef<HTMLElement>(null);

  function showAddress() {
    setCopyFailed(true);
    if (addressRef.current) selectNode(addressRef.current);
  }

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
      showAddress();
    }
  }

  return (
    <>
      <div className="handoff-buttons">
        {openHref ? (
          <Link href={openHref} className="handoff-open">
            {openLabel}
          </Link>
        ) : null}
        {canShare ? (
          <button type="button" onClick={share} className="ui-button">
            {shareLabel}
          </button>
        ) : null}
        <CopyButton value={url} label={copyLabel} onFailed={showAddress} />
      </div>
      <code
        ref={addressRef}
        tabIndex={0}
        className="handoff-address"
        onFocus={(event) => selectNode(event.currentTarget)}
        onClick={(event) => selectNode(event.currentTarget)}
      >
        {url}
      </code>
      {copyFailed ? (
        <p className="handoff-copy-hint">
          Couldn&rsquo;t copy automatically. The address is selected — copy it
          from there.
        </p>
      ) : null}
    </>
  );
}
