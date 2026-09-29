"use client";

import type { ReactNode } from "react";

import { useDesktop } from "@/components/os/desktop";

/** Opens the Sent window on this desktop instead of leaving for another page. */
export default function OpenSent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const desktop = useDesktop();
  return (
    <button
      type="button"
      className={className ?? "quiet-link"}
      onClick={(event) => desktop.open("sent", event.currentTarget)}
    >
      {children}
    </button>
  );
}
