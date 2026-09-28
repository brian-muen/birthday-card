"use client";

import type { Ref } from "react";
import MessageReader from "@/components/message-reader";
import { type PenId } from "@/lib/pen";
import { stockHex } from "@/lib/stock";

/** One page of the card, lying on the desk: what the recipient will hold. */
export default function ReplyPaper({
  recipientName,
  stock,
  body,
  authorName,
  pen,
  image,
  animate,
  paperRef,
}: {
  recipientName: string;
  stock: string;
  body: string;
  authorName: string;
  pen: PenId;
  image: string | null;
  animate: boolean;
  paperRef: Ref<HTMLElement>;
}) {
  return (
    <figure
      ref={paperRef}
      className="reply-paper"
      data-animate={animate || undefined}
      style={{ ["--card-stock" as string]: stockHex(stock) }}
      aria-label={`Preview of your note in ${recipientName}'s card`}
    >
      <div className="reply-paper-stack">
        <span className="reply-paper-cover" aria-hidden="true" />
        <div className="reply-paper-page">
          <div className="reply-paper-ink">
            <MessageReader
              body={body.trim() || "Your note will appear here."}
              authorName={authorName.trim() || "Your name"}
              pen={pen}
              image={image}
            />
          </div>
        </div>
      </div>
      <figcaption className="reply-paper-caption">
        How it looks in {recipientName}&apos;s card
      </figcaption>
    </figure>
  );
}
