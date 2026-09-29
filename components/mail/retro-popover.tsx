"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

type Box = { top: number; left: number; minWidth: number };

function sameBox(a: Box | null, b: Box) {
  return a !== null && a.top === b.top && a.left === b.left && a.minWidth === b.minWidth;
}

/** A menu or calendar anchored to a control, painted above every window. */
export default function RetroPopover({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!open || !anchor) return;
    function place() {
      const rect = anchor!.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      const width = Math.max(rect.width, panel?.width ?? 0);
      const height = panel?.height ?? 0;
      let left = rect.left;
      let top = rect.bottom + 4;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
      if (height > 0 && top + height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - height - 4);
      }
      const next = { top, left, minWidth: rect.width };
      setBox((current) => (sameBox(current, next) ? current : next));
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
      anchorRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="retro-popover"
      style={{
        position: "fixed",
        top: box?.top ?? -9999,
        left: box?.left ?? 0,
        minWidth: box?.minWidth,
        zIndex: 55,
        visibility: box ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
