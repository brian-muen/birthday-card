"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

export type PickerLink = {
  id: "sign" | "gift" | "organizer";
  label: string;
  hint: string;
  description: string;
  path: string;
  openLabel: string;
  shareTitle: string;
  shareText: string;
};

const subscribeToNothing = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";
const getCanShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

function Icon({ name }: { name: PickerLink["id"] | "copy" | "check" | "share" | "open" }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "sign":
      return (
        <svg {...common}>
          <path d="M4 20c2.5 0 3.5-1.5 5-3.5M15.5 4.5l4 4L9 19l-5 1 1-5z" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3.5-5.5-3.5-5 0M12 7c1.5-3.5 5.5-3.5 5 0" />
        </svg>
      );
    case "organizer":
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
      );
    case "open":
      return (
        <svg {...common}>
          <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
        </svg>
      );
  }
}

function selectNode(node: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

export default function LinkPicker({ links }: { links: PickerLink[] }) {
  const [active, setActive] = useState<PickerLink["id"]>(links[0].id);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const origin = useSyncExternalStore(subscribeToNothing, getOrigin, getServerOrigin);
  const canShare = useSyncExternalStore(subscribeToNothing, getCanShare, () => false);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const addressRef = useRef<HTMLElement>(null);
  const uid = useId();
  const link = links.find((item) => item.id === active) ?? links[0];
  const url = origin ? `${origin}${link.path}` : link.path;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  function choose(id: PickerLink["id"]) {
    setActive(id);
    setCopied(false);
    setCopyFailed(false);
  }

  function onTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = links[(index + step + links.length) % links.length];
    choose(next.id);
    tabs.current[next.id]?.focus();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
      if (addressRef.current) selectNode(addressRef.current);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: link.shareTitle, text: link.shareText, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCopyFailed(true);
      if (addressRef.current) selectNode(addressRef.current);
    }
  }

  return (
    <div className="link-picker" data-active={active}>
      <div className="link-tabs" role="tablist" aria-label="Which link">
        {links.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabs.current[item.id] = node;
            }}
            type="button"
            role="tab"
            id={`${uid}-${item.id}-tab`}
            aria-selected={item.id === active}
            aria-controls={`${uid}-panel`}
            tabIndex={item.id === active ? 0 : -1}
            className="link-tab"
            onClick={() => choose(item.id)}
            onKeyDown={(event) => onTabKey(event, index)}
          >
            <Icon name={item.id} />
            <span className="link-tab-label">{item.label}</span>
            <span className="link-tab-hint">{item.hint}</span>
          </button>
        ))}
      </div>

      <div
        className="link-panel"
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-${active}-tab`}
      >
        <p className="link-description">{link.description}</p>
        <div className="link-row">
          <code
            ref={addressRef}
            tabIndex={0}
            className="link-address"
            onFocus={(event) => selectNode(event.currentTarget)}
            onClick={(event) => selectNode(event.currentTarget)}
          >
            {url}
          </code>
          <div className="link-actions">
            <button
              type="button"
              className="icon-button"
              onClick={copy}
              aria-label={copied ? "Link copied" : `Copy the ${link.label.toLowerCase()} link`}
              title="Copy link"
              data-copied={copied ? "true" : undefined}
            >
              <Icon name={copied ? "check" : "copy"} />
            </button>
            {canShare ? (
              <button
                type="button"
                className="icon-button"
                onClick={share}
                aria-label={`Share the ${link.label.toLowerCase()} link`}
                title="Share"
              >
                <Icon name="share" />
              </button>
            ) : null}
            <Link href={link.path} className="icon-button" aria-label={link.openLabel} title={link.openLabel}>
              <Icon name="open" />
            </Link>
          </div>
        </div>
        <p className="link-status" aria-live="polite">
          {copied
            ? "Copied. Paste it wherever you like."
            : copyFailed
              ? "Couldn’t copy automatically. The address is selected, so copy it from there."
              : ""}
        </p>
      </div>
    </div>
  );
}
