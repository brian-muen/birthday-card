"use client";

import type { Ref } from "react";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";

export default function ReplyInvitation({
  recipientName,
  intro,
  received,
  hasDraft,
  replied,
  replyRef,
  onReply,
}: {
  recipientName: string;
  intro: string | null;
  received: string;
  hasDraft: boolean;
  replied: boolean;
  replyRef: Ref<HTMLButtonElement>;
  onReply: () => void;
}) {
  const subject = `Sign ${recipientName}'s birthday card`;
  const flag = hasDraft ? "Draft" : replied ? "Replied" : null;

  return (
    <OsWindow
      title="Inbox"
      width="44rem"
      className="reply-window reply-inbox"
      toolbar={
        <button
          ref={replyRef}
          type="button"
          className="os-button"
          data-variant="accent"
          onClick={onReply}
        >
          {hasDraft ? "Open your reply" : "Reply"}
        </button>
      }
      status={
        <>
          <span>1 message</span>
          {flag ? <span>{hasDraft ? "Your reply is saved as a draft" : "You replied"}</span> : null}
        </>
      }
    >
      <ul className="reply-list" aria-label="Messages">
        <li className="reply-row" aria-current="true">
          <PixelIcon name={flag ? "mail" : "unread"} className="reply-row-icon" />
          <span className="reply-row-text">
            <span className="reply-row-from">Birthday Mail</span>
            <span className="reply-row-subject">{subject}</span>
          </span>
          {flag ? <span className="reply-row-flag">{flag}</span> : null}
          <span className="reply-row-date">{received}</span>
        </li>
      </ul>

      <article className="reply-letter" aria-label={subject}>
        <header className="reply-letter-head">
          <h3>{subject}</h3>
          <dl>
            <dt>From</dt>
            <dd>Birthday Mail</dd>
            <dt>To</dt>
            <dd>You</dd>
          </dl>
        </header>

        <div className="reply-letter-body">
          {intro ? (
            <>
              <p className="reply-letter-lead">
                The person putting together {recipientName}&apos;s card wrote:
              </p>
              <blockquote className="reply-quote">{intro}</blockquote>
            </>
          ) : (
            <p>You&apos;re invited to sign {recipientName}&apos;s birthday card.</p>
          )}
          <p>
            Reply to this message to write your note. Pick a pen, and your note goes
            into the card in that handwriting. You can add a photo too.
          </p>
          <p>
            Your note is private. Only {recipientName} and the organizer will read
            it. Other signers can&apos;t see your note, and you can&apos;t see theirs.
          </p>
          <p>The organizer sends the card to {recipientName} when it&apos;s ready.</p>
        </div>
      </article>
    </OsWindow>
  );
}
