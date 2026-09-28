"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { LogoMark } from "@/components/logo";
import { PixelIcon } from "@/components/os/pixel-icon";
import { getSoundOn, getSoundServer, setSoundOn, subscribeToSound } from "@/components/os/sound";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export type MenuBarBirthday = { day: string; greeting: string };

function subscribeToMinute(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
}

function localDay(now: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function useNow<T>(read: (now: Date) => T, server: T) {
  return useSyncExternalStore(
    subscribeToMinute,
    () => read(new Date()),
    () => server,
  );
}

function Clock() {
  const time = useNow((now) => timeFormat.format(now), "");
  return <span suppressHydrationWarning>{time}</span>;
}

function DateOrBirthday({ birthday }: { birthday?: MenuBarBirthday | null }) {
  const today = useNow(localDay, "");
  const date = useNow((now) => dateFormat.format(now).replace(",", ""), "");
  if (birthday && today === birthday.day) {
    return (
      <span className="os-menubar-birthday">
        <PixelIcon name="cake" />
        <span>{birthday.greeting}</span>
      </span>
    );
  }
  return (
    <span className="os-menubar-date" suppressHydrationWarning>
      {date}
    </span>
  );
}

function SoundToggle() {
  const on = useSyncExternalStore(subscribeToSound, getSoundOn, getSoundServer);
  return (
    <button
      type="button"
      className="os-menubar-sound"
      aria-label="Sound effects"
      aria-pressed={on}
      title={on ? "Sound effects on" : "Sound effects off"}
      onClick={() => setSoundOn(!on)}
    >
      <PixelIcon name={on ? "sound" : "mute"} />
    </button>
  );
}

export default function MenuBar({
  status,
  birthday,
}: {
  status?: ReactNode;
  birthday?: MenuBarBirthday | null;
}) {
  return (
    <nav className="os-menubar" aria-label="Menu bar">
      <Link href="/" className="os-menubar-logo">
        <LogoMark />
        <span className="os-menubar-name">Birthday Mail</span>
      </Link>
      <div className="os-menubar-status">
        {status}
        <DateOrBirthday birthday={birthday} />
        <SoundToggle />
        <Clock />
      </div>
    </nav>
  );
}
