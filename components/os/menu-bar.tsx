"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { LogoMark } from "@/components/logo";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function subscribeToMinute(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
}

function Clock() {
  const time = useSyncExternalStore(
    subscribeToMinute,
    () => timeFormat.format(new Date()),
    () => "",
  );
  return <span suppressHydrationWarning>{time}</span>;
}

export default function MenuBar({ status }: { status?: ReactNode }) {
  return (
    <nav className="os-menubar" aria-label="Menu bar">
      <Link href="/" className="os-menubar-logo">
        <LogoMark />
        <span className="os-menubar-name">Birthday Mail</span>
      </Link>
      <div className="os-menubar-status">
        {status}
        <Clock />
      </div>
    </nav>
  );
}
