"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Other tabs hear this and refresh the desk that is already open. */
export const SIGNED_IN_SIGNAL = "birthday-mail:signed-in";

export function announceSignedIn() {
  try {
    localStorage.setItem(SIGNED_IN_SIGNAL, String(Date.now()));
  } catch {
    // Private mode only means the open desk waits for a reload.
  }
}

/** While signed out, refresh this page when another tab finishes Google sign-in. */
export function SignInWatch() {
  const router = useRouter();
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SIGNED_IN_SIGNAL) return;
      router.refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);
  return null;
}

/** The tab Google returns to. Tells the desk left open that the session exists. */
export function AnnounceSignedIn() {
  useEffect(() => {
    announceSignedIn();
  }, []);
  return (
    <main className="signed-in-done">
      <h1>You’re signed in</h1>
      <p>You can close this tab.</p>
    </main>
  );
}
