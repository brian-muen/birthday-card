"use client";

import Link from "next/link";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const DRAG_QUERY = "(min-width: 48rem) and (pointer: fine)";

/**
 * A classic window: striped title bar, close box, optional toolbar and
 * status bar. With `draggable`, the title bar moves the window on
 * desktop pointers; touch screens keep it in the flow.
 */
export default function OsWindow({
  title,
  width,
  onClose,
  closeHref,
  closeLabel = "Close",
  draggable = false,
  toolbar,
  status,
  className = "",
  style,
  children,
}: {
  title: ReactNode;
  width?: string;
  onClose?: () => void;
  closeHref?: string;
  closeLabel?: string;
  draggable?: boolean;
  toolbar?: ReactNode;
  status?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const titleId = useId();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggable || event.button !== 0) return;
    if ((event.target as Element).closest("button, a")) return;
    if (!window.matchMedia(DRAG_QUERY).matches) return;
    start.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const from = start.current;
    if (!from) return;
    setOffset({
      x: from.ox + event.clientX - from.x,
      y: from.oy + event.clientY - from.y,
    });
  }

  function endDrag() {
    start.current = null;
    setDragging(false);
  }

  const closeBox = onClose ? (
    <button type="button" className="os-close" onClick={onClose} aria-label={closeLabel} />
  ) : closeHref ? (
    <Link href={closeHref} className="os-close" aria-label={closeLabel} />
  ) : null;

  return (
    <section
      className={`os-window ${className}`}
      aria-labelledby={titleId}
      data-draggable={draggable || undefined}
      data-dragging={dragging || undefined}
      style={{
        ...(width ? { ["--window-width" as string]: width } : null),
        ...(offset.x || offset.y
          ? { translate: `${offset.x}px ${offset.y}px` }
          : null),
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
