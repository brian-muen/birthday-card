"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import { AppCloseContext } from "@/components/os/desktop";

const DRAG_QUERY = "(min-width: 48rem) and (pointer: fine)";
const STACK_QUERY = "(min-width: 48rem)";
const KEEP_X = 64;
const KEEP_BOTTOM = 28;

// Desktop windows from back to front; the last one is the active window.
let stack: string[] = [];
const stackListeners = new Set<() => void>();

function subscribeToStack(onChange: () => void) {
  stackListeners.add(onChange);
  return () => {
    stackListeners.delete(onChange);
  };
}

function setStack(next: string[]) {
  stack = next;
  stackListeners.forEach((listener) => listener());
}

type Offset = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

function boundsFor(el: HTMLElement, offset: Offset): Bounds | null {
  const desk = el.closest(".os-desktop")?.getBoundingClientRect();
  if (!desk) return null;
  const box = el.getBoundingClientRect();
  // Sit the whole window on the desktop. A window larger than the desktop
  // cannot; then keep the title bar reachable so it can be dragged back.
  const minX = offset.x + desk.left - box.left;
  const maxX = offset.x + desk.right - box.right;
  const minY = offset.y + desk.top - box.top;
  const maxY = offset.y + desk.bottom - box.bottom;
  const fitsX = maxX >= minX;
  const fitsY = maxY >= minY;
  return {
    minX: fitsX ? minX : offset.x + desk.left + KEEP_X - box.right,
    maxX: fitsX ? maxX : offset.x + desk.right - KEEP_X - box.left,
    minY,
    maxY: fitsY ? maxY : offset.y + desk.bottom - KEEP_BOTTOM - box.top,
  };
}

function place(el: HTMLElement, { x, y }: Offset) {
  el.style.translate = x || y ? `${x}px ${y}px` : "";
}

function readOffset(key: string): Offset | null {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key) ?? "null");
    return typeof saved?.x === "number" && typeof saved?.y === "number" ? saved : null;
  } catch {
    return null;
  }
}

/**
 * A classic window: striped title bar, close box, optional toolbar and
 * status bar. On desktop widths, clicking or focusing a window brings it to
 * the front. With `draggable`, the title bar moves the window on desktop
 * pointers (remembered for the tab);
 * touch screens keep it in the flow. Inside an `AppWindow`, the close box
 * closes the app to the desktop unless `onClose` says otherwise.
 */
export default function OsWindow({
  title,
  width,
  onClose,
  closeLabel,
  draggable = false,
  raiseOnMount = false,
  toolbar,
  status,
  className = "",
  style,
  children,
}: {
  title: ReactNode;
  width?: string;
  onClose?: () => void;
  closeLabel?: string;
  draggable?: boolean;
  /** Put this window in front as soon as it mounts. For windows opened over others. */
  raiseOnMount?: boolean;
  toolbar?: ReactNode;
  status?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const titleId = useId();
  const pathname = usePathname();
  const closeApp = useContext(AppCloseContext);
  const close = onClose ?? closeApp;
  const ref = useRef<HTMLElement>(null);
  const offset = useRef<Offset>({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; bounds: Bounds | null } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const depth = useSyncExternalStore(subscribeToStack, () => stack.indexOf(titleId), () => -1);

  const name = className.trim().split(/\s+/)[0] || (typeof title === "string" ? title : "");
  const storageKey = draggable && name ? `birthday-mail:window:${pathname}:${name}` : null;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !draggable) return;
    const query = window.matchMedia(DRAG_QUERY);
    const saved = storageKey ? readOffset(storageKey) : null;
    if (saved && query.matches) {
      const bounds = boundsFor(el, offset.current);
      offset.current = bounds
        ? { x: clamp(saved.x, bounds.minX, bounds.maxX), y: clamp(saved.y, bounds.minY, bounds.maxY) }
        : saved;
      place(el, offset.current);
    }
    const onChange = () => place(el, query.matches ? offset.current : { x: 0, y: 0 });
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [draggable, storageKey]);

  const raise = useCallback(() => {
    if (stack.at(-1) === titleId) return;
    if (ref.current?.closest("dialog")) return;
    if (!window.matchMedia(STACK_QUERY).matches) return;
    setStack([...stack.filter((id) => id !== titleId), titleId]);
  }, [titleId]);

  // Focus from opening a window does not go through React's onFocus. The
  // listener raises it, and the cleanup drops it when the window unmounts.
  // That cleanup stays in layout so Strict Mode cannot wipe a raise that
  // happens after this commit, in the same click that opened the window.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (raiseOnMount) raise();
    const onFocusIn = () => raise();
    el.addEventListener("focusin", onFocusIn);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      setStack(stack.filter((id) => id !== titleId));
    };
  }, [raise, raiseOnMount, titleId]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!draggable || !el || event.button !== 0) return;
    if ((event.target as Element).closest("button, a")) return;
    if (!window.matchMedia(DRAG_QUERY).matches) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.current.x,
      oy: offset.current.y,
      bounds: boundsFor(el, offset.current),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const from = drag.current;
    if (!from || !ref.current) return;
    let x = from.ox + event.clientX - from.x;
    let y = from.oy + event.clientY - from.y;
    if (from.bounds) {
      x = clamp(x, from.bounds.minX, from.bounds.maxX);
      y = clamp(y, from.bounds.minY, from.bounds.maxY);
    }
    offset.current = { x, y };
    place(ref.current, offset.current);
  }

  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(offset.current));
    } catch {}
  }

  const closeBox = close ? (
    <button
      type="button"
      className="os-close"
      onClick={close}
      aria-label={closeLabel ?? (typeof title === "string" ? `Close ${title}` : "Close")}
    />
  ) : null;

  return (
    <section
      ref={ref}
      tabIndex={closeApp ? -1 : undefined}
      className={`os-window ${className}`}
      aria-labelledby={titleId}
      data-draggable={draggable || undefined}
      data-dragging={dragging || undefined}
      onPointerDownCapture={raise}
      onFocusCapture={raise}
      style={{
        ...(width ? { ["--window-width" as string]: width } : null),
        ...(draggable && depth >= 0 ? { zIndex: depth + 1 } : null),
        ...style,
      }}
    >
      <div
        className="os-titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {closeBox}
        <h2 id={titleId} className="os-window-title">
          {title}
        </h2>
      </div>
      {toolbar ? <div className="os-toolbar">{toolbar}</div> : null}
      <div className="os-window-body">{children}</div>
      {status ? <div className="os-statusbar">{status}</div> : null}
    </section>
  );
}
