"use client";

import { PENS, penVar, type PenId } from "@/lib/pen";

/** Pens shown like a font menu: each face writes a sample of the signer's name. */
export default function ReplyPenPicker({
  pen,
  sample,
  disabled,
  onChange,
}: {
  pen: PenId;
  sample: string;
  disabled: boolean;
  onChange: (pen: PenId) => void;
}) {
  return (
    <fieldset className="reply-pens" disabled={disabled}>
      <legend>
        Pen <span>for your handwriting on the card</span>
      </legend>
      <div className="reply-pen-tray">
        {PENS.map((option) => (
          <label key={option.id} className="reply-pen" data-pen={option.id}>
            <input
              type="radio"
              name="pen"
              value={option.id}
              checked={pen === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <span
              className="reply-pen-sample font-card"
              style={{ ["--card-face" as string]: penVar(option.id) }}
              aria-hidden="true"
            >
              <span>{sample}</span>
            </span>
            <span className="reply-pen-name">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
