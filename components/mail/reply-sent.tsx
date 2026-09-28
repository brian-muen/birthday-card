"use client";

import type { Ref } from "react";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import type { PenId } from "@/lib/pen";

const PEN_PHRASE: Record<PenId, string> = {
  fountain: "fountain pen",
  marker: "marker",
  pencil: "pencil",
  ballpoint: "ballpoint",
  brush: "brush pen",
};

export default function ReplySent({
  recipientName,
  authorName,
  pen,
  headingRef,
  onWriteAnother,
  onDone,
}: {
  recipientName: string;
  authorName: string;
  pen: PenId;
  headingRef: Ref<HTMLHeadingElement>;
  onWriteAnother: () => void;
  onDone: () => void;
}) {
  return (
    <OsWindow
      title="Sent"
      width="27rem"
      className="reply-sent"
      onClose={onDone}
      closeLabel="Close"
    >
      <div className="reply-sent-body">
        <PixelIcon name="card" className="reply-sent-icon" />
        <div>
          <h3 ref={headingRef} tabIndex={-1}>
            Your note is in {recipientName}&apos;s card.
          </h3>
          <p>
            Signed {authorName}, in {PEN_PHRASE[pen]}. {recipientName} will read it
            when the organizer sends the card. Only {recipientName} and the organizer
            can see it.
          </p>
        </div>
      </div>
      <div className="reply-sent-actions">
        <button type="button" className="os-button" onClick={onWriteAnother}>
          Write another note
        </button>
        <button type="button" className="os-button" onClick={onDone}>
          Back to inbox
        </button>
      </div>
    </OsWindow>
  );
}
