"use client";

import { useContext, useEffect, useRef, type ReactNode } from "react";

import { MailIcon } from "@/components/mail/outbox-icons";
import { AppCloseContext, AppWindow, useDesktop } from "@/components/os/desktop";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import "@/app/signin.css";

const DEFAULT_HEADING = "Sign in to start a card";
const DEFAULT_DETAIL =
  "Every card you start is kept in Sent, so its links are never lost. People signing and the birthday person never need an account.";

/**
 * The sign-in window. Continue with Google opens in a new tab; this desktop
 * stays put. `next` is the page Google’s callback keeps the draft or card for.
 */
export default function SignInWindow({
  next,
  error,
  heading = DEFAULT_HEADING,
  detail = DEFAULT_DETAIL,
  note,
  headingLevel = "h1",
}: {
  next: string;
  error?: string;
  heading?: string;
  detail?: string;
  note?: string;
  headingLevel?: "h1" | "h2";
}) {
  const close = useContext(AppCloseContext);
  const continueRef = useRef<HTMLAnchorElement>(null);
  const Heading = headingLevel;

  useEffect(() => {
    continueRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!close) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <OsWindow
      title="Sign in"
      width="27rem"
      className="signin"
      draggable
      raiseOnMount
      closeLabel="Close sign in"
    >
      <div className="signin-body">
        <PixelIcon name="person" className="signin-icon" />
        <div className="signin-copy">
          <Heading>{heading}</Heading>
          <p>{detail}</p>
          {note ? <p>{note}</p> : null}
        </div>
      </div>
      {error ? (
        <div className="signin-error">
          <MailIcon name="alert" className="signin-error-icon" />
          <p role="alert">{error}</p>
        </div>
      ) : null}
      <div className="signin-actions">
        {close ? (
          <button type="button" className="os-button" data-variant="quiet" onClick={close}>
            Not now
          </button>
        ) : null}
        <a
          ref={continueRef}
          className="os-button"
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Continue with Google
        </a>
      </div>
    </OsWindow>
  );
}

/** The sign-in app on a desktop that is already showing something else. */
export function SignInApp({
  next,
  error,
  heading,
  detail,
  note,
  headingLevel = "h2",
}: {
  next: string;
  error?: string;
  heading?: string;
  detail?: string;
  note?: string;
  headingLevel?: "h1" | "h2";
}) {
  return (
    <AppWindow app="sign-in">
      <SignInWindow
        next={next}
        error={error}
        heading={heading}
        detail={detail}
        note={note}
        headingLevel={headingLevel}
      />
    </AppWindow>
  );
}

/** Lets a parent outside the desktop open the sign-in window. */
export function SignInBridge({
  openRef,
}: {
  openRef: { current: (from?: Element | null) => void };
}) {
  const desktop = useDesktop();
  useEffect(() => {
    openRef.current = (from) => desktop.open("sign-in", from);
  }, [desktop, openRef]);
  return null;
}

/** A button on this desktop that opens Sign in instead of leaving the page. */
export function OpenSignInButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const desktop = useDesktop();
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => desktop.open("sign-in", event.currentTarget)}
    >
      {children}
    </button>
  );
}
