"use client";

import { useEffect, useId, useRef, useState } from "react";

import RetroPopover from "@/components/mail/retro-popover";
import { PICKER_DESIGNS, type DesignId } from "@/lib/design";

/** Cover choices as a desktop menu, not the browser's select list. */
export default function CoverPicker({
  value,
  onChange,
}: {
  value: DesignId;
  onChange: (id: DesignId) => void;
}) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selected = PICKER_DESIGNS.findIndex((option) => option.id === value);
  const [active, setActive] = useState(Math.max(0, selected));
  const label = PICKER_DESIGNS[selected]?.label ?? "Cover";

  function choose(index: number) {
    const option = PICKER_DESIGNS[index];
    if (!option) return;
    onChange(option.id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActive(Math.max(0, selected));
      setOpen(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    document.getElementById(listId)?.focus();
  }, [listId, open]);

  function onListKey(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % PICKER_DESIGNS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + PICKER_DESIGNS.length) % PICKER_DESIGNS.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(PICKER_DESIGNS.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    }
  }

  return (
    <div className="retro-anchor">
      <input type="hidden" name="design" value={value} />
      <button
        ref={buttonRef}
        type="button"
        id="design"
        className="compose-select"
        aria-label={`Cover, ${label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setActive(Math.max(0, selected));
          setOpen((current) => !current);
        }}
        onKeyDown={onButtonKey}
      >
        {label}
      </button>
      <RetroPopover anchorRef={buttonRef} open={open} onClose={() => setOpen(false)}>
        <ul
          id={listId}
          role="listbox"
          aria-label="Cover"
          tabIndex={-1}
          className="retro-menu"
          onKeyDown={onListKey}
        >
          {PICKER_DESIGNS.map((option, index) => (
            <li key={option.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                data-active={index === active || undefined}
                className="retro-menu-option"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </RetroPopover>
    </div>
  );
}
