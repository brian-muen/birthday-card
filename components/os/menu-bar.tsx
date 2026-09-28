"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { LogoMark } from "@/components/logo";
import HelpButton from "@/components/os/help";

export type MenuItem =
  | { label: string; href: string; download?: boolean }
  | { label: string; onSelect: () => void }
  | { label: string; action: (formData: FormData) => void | Promise<void> };

/** A menu with items opens a list; a menu with only `href` is a plain link. */
export type Menu =
  | { label: string; items: MenuItem[] }
  | { label: string; href: string };

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

export default function MenuBar({
  menus,
  status,
}: {
  menus: Menu[];
  status?: ReactNode;
}) {
  return (
    <nav className="os-menubar" aria-label="Menu bar">
      <Link href="/" className="os-menubar-logo">
        <LogoMark />
        <span className="os-menubar-name">Birthday Mail</span>
      </Link>
      <div className="os-menubar-menus">
        {menus.map((menu) =>
          "href" in menu ? (
            <Link key={menu.label} href={menu.href} className="os-menubar-link">
              {menu.label}
            </Link>
          ) : (
            <DropMenu key={menu.label} menu={menu} />
          ),
        )}
      </div>
      <div className="os-menubar-status">
        {status}
        <Clock />
        <HelpButton />
      </div>
    </nav>
  );
}

function DropMenu({ menu }: { menu: { label: string; items: MenuItem[] } }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="os-menu" ref={rootRef}>
      <button
        type="button"
        className="os-menu-trigger"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        {menu.label}
      </button>
      {open ? (
        <ul id={listId} className="os-menu-list">
          {menu.items.map((item) => (
            <li key={item.label}>
              <MenuEntry item={item} onDone={() => setOpen(false)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MenuEntry({ item, onDone }: { item: MenuItem; onDone: () => void }) {
  if ("href" in item) {
    return item.download ? (
      <a href={item.href} download className="os-menu-item" onClick={onDone}>
        {item.label}
      </a>
    ) : (
      <Link href={item.href} className="os-menu-item" onClick={onDone}>
        {item.label}
      </Link>
    );
  }
  if ("action" in item) {
    return (
      <form action={item.action}>
        <button type="submit" className="os-menu-item">
          {item.label}
        </button>
      </form>
    );
  }
  return (
    <button
      type="button"
      className="os-menu-item"
      onClick={() => {
        onDone();
        item.onSelect();
      }}
    >
      {item.label}
    </button>
  );
}
