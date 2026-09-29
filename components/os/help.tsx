"use client";

import { useRef } from "react";

import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { zoomRects } from "@/components/os/zoom-rects";

const QUESTIONS = [
  {
    q: "What is Birthday Mail?",
    a: "A group birthday card that arrives like email. One person starts the card, friends each write a note, and the birthday person opens the notes as messages, then turns them into a paper card.",
  },
  {
    q: "How do I start a card?",
    a: "Write a new message on the home screen: who it’s for, an optional note for the people signing, and a cover and paper. Sign in with Google if you haven’t, then Send gives you the links to share.",
  },
  {
    q: "What are the three links for?",
    a: "The signing link goes to everyone who should write a note. The gift link goes to the birthday person when the card is ready. The organizer link is just for you: it lets you read every note and remove one if you need to.",
  },
  {
    q: "Who can read the notes?",
    a: "Only the birthday person and the organizer. People signing see the organizer’s note and their own, never anyone else’s.",
  },
  {
    q: "When does the birthday person get the card?",
    a: "When the organizer sends them the gift link. Nothing is scheduled: the birthday on the card only tells signers when to sign by, and sharing the link is the delivery.",
  },
  {
    q: "What can a note include?",
    a: "Up to 2,000 characters, a pen for how it looks on the paper card, and one photo.",
  },
  {
    q: "Can I change my note after sending it?",
    a: "Not yet. Ask the organizer to remove it, then write a new one from the same signing link.",
  },
  {
    q: "What does Transform do?",
    a: "It turns the inbox into the paper card, closed on the cover, so you can flip through. Each note is in the pen its writer chose. Turn it back returns you to the messages.",
  },
  {
    q: "Can I keep a copy?",
    a: "Yes. The Print icon on the card’s desktop downloads the whole card as a PDF. On the paper card, it’s Print.",
  },
  {
    q: "Do I need an account?",
    a: "Only to start a card. Organizers sign in with Google, and every card they start stays in Sent, so its links can always be found again. Signing a card and opening one never need an account.",
  },
];

export default function HelpButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function open() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const win = dialog.querySelector(".os-window");
    zoomRects(triggerRef.current, win, { host: dialog, hide: win });
  }

  function close() {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    const from = dialog.querySelector(".os-window")?.getBoundingClientRect();
    dialog.close();
    zoomRects(from, triggerRef.current);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="os-icon os-help-trigger"
        aria-haspopup="dialog"
        onClick={open}
      >
        <PixelIcon name="help" />
        <span className="os-icon-label">Help</span>
      </button>
      <dialog
        ref={dialogRef}
        className="os-help"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <OsWindow title="Help" onClose={close} closeLabel="Close help">
          <div className="os-help-body">
            {QUESTIONS.map(({ q, a }) => (
              <details key={q} className="os-help-item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </OsWindow>
      </dialog>
    </>
  );
}
