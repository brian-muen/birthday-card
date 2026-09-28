"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const PREFIX = "birthday-mail:read:";

// Private browsing can refuse storage; reads still stick for this visit.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string) {
  if (memory.has(key)) return memory.get(key) ?? "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (!event.key?.startsWith(PREFIX)) return;
    memory.delete(event.key);
    listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parse(raw: string | null): Set<number> {
  if (!raw) return new Set();
  try {
    const value: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(value) ? value.filter((id) => Number.isInteger(id)) : [],
    );
  } catch {
    return new Set();
  }
}

/** Which notes this browser has opened, per link. */
export function useReadState(token: string) {
  const key = PREFIX + token;
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const readIds = useMemo(() => parse(raw), [raw]);

  const setRead = useCallback(
    (id: number, isRead: boolean) => {
      const next = parse(read(key));
      if (next.has(id) === isRead) return;
      if (isRead) next.add(id);
      else next.delete(id);
      write(key, JSON.stringify([...next]));
    },
    [key],
  );

  return { readIds, setRead, loaded: raw !== null };
}
