"use client";

import { useEffect, useRef } from "react";

import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import "@/app/signin.css";

/** Shown when a signed-out organizer presses Send; Google returns them to `/`. */
export default function ComposeSignIn({
  hasDraft,
  onDismiss,
}: {
  hasDraft: boolean;
  onDismiss: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    continueRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <OsWindow
      title="Sign in"
      width="27rem"
      className="compose-alert"
      onClose={onDismiss}
      closeLabel="Close sign in"
    >
      <div className="signin-body">
        <PixelIcon name="person" className="signin-icon" />
        <div className="signin-copy">
          <h2>Sign in to send your card</h2>
          <p>
            Organizers sign in with Google, so every card you start stays in
            Sent with its links. People signing never need an account.
          </p>
          {hasDraft ? (
            <p>Your message will be here when you get back.</p>
          ) : null}
        </div>
      </div>
      <form action="/api/auth/google" method="get" className="signin-actions">
        <input type="hidden" name="next" value="/" />
        <button type="button" className="os-button" data-variant="quiet" onClick={onDismiss}>
          Not now
        </button>
        <button ref={continueRef} type="submit" className="os-button">
          Continue with Google
        </button>
      </form>
    </OsWindow>
  );
}
