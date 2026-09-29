"use client";

import { useMemo, useRef, useState } from "react";

import RetroPopover from "@/components/mail/retro-popover";
import { birthdayAllowed, formatBirthday } from "@/lib/birthday";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function isoLocal(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fieldLabel(iso: string) {
  const time = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(time)) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: { iso: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < first; i += 1) {
    const date = new Date(year, month, 1 - (first - i));
    cells.push({ iso: isoLocal(date), day: date.getDate(), inMonth: false });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ iso: isoLocal(new Date(year, month, day)), day, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month, count + (cells.length - first - count + 1));
    cells.push({ iso: isoLocal(date), day: date.getDate(), inMonth: false });
  }
  return cells;
}

/** The birthday as a desktop calendar, not the browser's date widget. */
export default function BirthdayPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const today = isoLocal(new Date());
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function openAtValue() {
    const shown = value ? new Date(`${value}T00:00:00`) : new Date();
    setCursor({ year: shown.getFullYear(), month: shown.getMonth() });
    setOpen(true);
  }

  function pick(iso: string) {
    if (!birthdayAllowed(iso)) return;
    onChange(iso);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function shiftMonth(by: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="retro-anchor">
      <input type="hidden" name="birthday" value={value} />
      <button
        ref={buttonRef}
        type="button"
        id="birthday"
        className="os-header-field compose-date"
        data-empty={value ? undefined : true}
        aria-label={value ? `Birthday, ${fieldLabel(value)}` : "Birthday, no date"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby="birthday-hint"
        onClick={() => (open ? setOpen(false) : openAtValue())}
      >
        {value ? fieldLabel(value) : "mm/dd/yyyy"}
      </button>
      <RetroPopover anchorRef={buttonRef} open={open} onClose={() => setOpen(false)}>
        <div className="retro-calendar" role="dialog" aria-label="Birthday">
          <div className="retro-calendar-bar">
            <button type="button" className="retro-calendar-step" data-dir="prev" aria-label="Previous month" onClick={() => shiftMonth(-1)} />
            <p className="retro-calendar-title">{title}</p>
            <button type="button" className="retro-calendar-step" data-dir="next" aria-label="Next month" onClick={() => shiftMonth(1)} />
          </div>
          <div className="retro-calendar-week" aria-hidden="true">
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="retro-calendar-grid">
            {cells.map((cell) => {
              const allowed = cell.inMonth && birthdayAllowed(cell.iso);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className="retro-calendar-day"
                  data-outside={cell.inMonth ? undefined : true}
                  data-today={cell.iso === today || undefined}
                  data-selected={cell.iso === value || undefined}
                  disabled={!allowed}
                  aria-label={formatBirthday(cell.iso) || cell.iso}
                  aria-pressed={cell.iso === value}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="retro-calendar-foot">
            <button
              type="button"
              className="retro-calendar-clear"
              onClick={() => {
                onChange("");
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              No date
            </button>
          </div>
        </div>
      </RetroPopover>
    </div>
  );
}
