"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { PixelIcon } from "@/components/os/pixel-icon";
import { nameList } from "./inbox-arrival";

const TICK_MS = 100;
const TICKS = 11;
const SEGMENTS = 10;
const KEY = "birthday-mail:booted:";

export function hasBooted(token: string) {
  try {
    return window.localStorage.getItem(KEY + token) === "1";
  } catch {
    return true;
  }
}

export function markBooted(token: string) {
  try {
    window.localStorage.setItem(KEY + token, "1");
  } catch {}
}

function messageFor(tick: number, count: number) {
  const sorting =
    count === 0 ? "Checking the mailbox…" : `Sorting ${count} ${count === 1 ? "message" : "messages"}…`;
  return ["Inflating balloons…", "Lighting the candles…", sorting, "Warming up the cake…"][
    Math.min(3, Math.floor(tick / 3))
  ];
}

/**
 * A one-second start-up screen the first time a gift link opens on this
 * browser: the app's name, who it was made for, and who it's from. Any click
 * or key skips it.
 */
export default function InboxBoot({
  recipientName,
  senders,
  onDone,
}: {
  recipientName: string;
  senders: string[];
  onDone: () => void;
}) {
  const [tick, setTick] = useState(0);
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    let n = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done.current();
    };
    const id = window.setInterval(() => {
      n += 1;
      if (n >= TICKS) finish();
      else setTick(n);
    }, TICK_MS);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  const filled = Math.min(SEGMENTS, tick);
  const from = nameList([...new Set(senders)]);

  return (
    <>
      <p className="sr-only" role="status">
        Starting Birthday Mail
      </p>
      <div className="os-window inbox-boot" aria-hidden="true">
        <div className="inbox-boot-art">
          <PixelIcon name="cake" />
        </div>
        <div className="inbox-boot-main">
          <p className="inbox-boot-mark">Birthday Mail</p>
          <p className="inbox-boot-for">Made for {recipientName}</p>
          {from ? <p className="inbox-boot-credits">With love from {from}</p> : null}
          <div className="inbox-boot-status">
            <span>{messageFor(tick, senders.length)}</span>
            <span>{filled * 10}%</span>
          </div>
          <div className="inbox-boot-bar">
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} data-on={i < filled || undefined} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
