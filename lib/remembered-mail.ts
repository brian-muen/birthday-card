"use client";

import { useMemo, useSyncExternalStore } from "react";

const KEY = "birthday-mail:remembered";
const LATER_KEY = "birthday-mail:remembered-later";
const READ_PREFIX = "birthday-mail:read:";
const LIMIT = 5;
const SENDERS = 3;

/** Just enough to announce a gift and link back to it; never the notes themselves. */
export type RememberedCard = {
  token: string;
  recipientName: string;
  noteIds: number[];
  senders: string[];
  senderCount: number;
  openedAt: number;
};

export type RememberedMail = RememberedCard & { unread: number };

// Private browsing can refuse storage; the card is still remembered for this visit.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function storage(kind: "local" | "session") {
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function read(key: string, kind: "local" | "session" = "local") {
  if (memory.has(key)) return memory.get(key) ?? "";
  try {
    return storage(kind).getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string | null, kind: "local" | "session" = "local") {
  memory.set(key, value ?? "");
  try {
    if (value === null) storage(kind).removeItem(key);
    else storage(kind).setItem(key, value);
  } catch {}
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key && !event.key.startsWith("birthday-mail:")) return;
    if (event.key) memory.delete(event.key);
    else memory.clear();
    listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function isCard(value: unknown): value is RememberedCard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.token === "string" &&
    typeof card.recipientName === "string" &&
    Array.isArray(card.noteIds) &&
    card.noteIds.every((id) => Number.isInteger(id)) &&
    Array.isArray(card.senders) &&
    card.senders.every((name) => typeof name === "string") &&
    typeof card.senderCount === "number" &&
    typeof card.openedAt === "number"
  );
}

function parseCards(raw: string): RememberedCard[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isCard).slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

// Read state belongs to inbox-read-state, so skip the memory fallback here.
function readRaw(token: string) {
  try {
    return window.localStorage.getItem(READ_PREFIX + token) ?? "";
  } catch {
    return "";
  }
}

function parseReadIds(raw: string) {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

/** Remember a gift link this browser opened, most recent first. */
export function rememberCard(card: {
  token: string;
  recipientName: string;
  notes: { id: number; authorName: string }[];
}) {
  const names = [...new Set(card.notes.map((note) => note.authorName.trim()).filter(Boolean))];
  const entry: RememberedCard = {
    token: card.token,
    recipientName: card.recipientName,
    noteIds: card.notes.map((note) => note.id),
    senders: names.slice(0, SENDERS),
    senderCount: names.length,
    openedAt: Date.now(),
  };
  const rest = parseCards(read(KEY)).filter((saved) => saved.token !== card.token);
  write(KEY, JSON.stringify([entry, ...rest].slice(0, LIMIT)));
  notify();
}

/** Forget a gift link, along with which of its notes were read here. */
export function forgetCard(token: string) {
  const rest = parseCards(read(KEY)).filter((saved) => saved.token !== token);
  write(KEY, rest.length ? JSON.stringify(rest) : null);
  try {
    window.localStorage.removeItem(READ_PREFIX + token);
  } catch {}
  notify();
}

/** Hide the home alert for this session, until a different card is opened. */
export function dismissUntilLater(token: string) {
  write(LATER_KEY, token, "session");
  notify();
}

export function showAgain() {
  write(LATER_KEY, null, "session");
  notify();
}

function snapshot() {
  const raw = read(KEY);
  const reads = parseCards(raw).map((card) => readRaw(card.token));
  return JSON.stringify([raw, read(LATER_KEY, "session"), reads]);
}

/** Gift links opened in this browser, with unread counts from the inbox's read state. */
export function useRememberedMail() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => null);
  return useMemo(() => {
    if (snap === null) return { cards: [], later: "" };
    const [raw, later, reads] = JSON.parse(snap) as [string, string, string[]];
    const cards: RememberedMail[] = parseCards(raw).map((card, index) => {
      const opened = parseReadIds(reads[index] ?? "");
      return { ...card, unread: card.noteIds.filter((id) => !opened.has(id)).length };
    });
    return { cards, later };
  }, [snap]);
}
