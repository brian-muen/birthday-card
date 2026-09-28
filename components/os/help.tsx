"use client";

import { useRef } from "react";

import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";

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
    a: "Only the birthday person and the organizer. People signing see the invitation and their own note, never anyone else’s.",
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
    a: "It turns the inbox into the paper card, with each note in the pen its writer chose. Turn it back returns you to the messages.",
  },
  {
    q: "Can I keep a copy?",
    a: "Yes. The Keepsake icon along the bottom of the card’s screen downloads the whole card as a PDF. On the paper card, it’s Save PDF keepsake.",
  },
  {
    q: "Do I need an account?",
    a: "Only to start a card. Organizers sign in with Google, and every card they start stays in Sent, so its links can always be found again. Signing a card and opening one never need an account.",
  },
];

export default function HelpButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="os-icon os-help-trigger"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <PixelIcon name="help" />
        <span className="os-icon-label">Help</span>
      </button>
      <dialog
        ref={dialogRef}
        className="os-help"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <OsWindow
          title="Help"
          onClose={() => dialogRef.current?.close()}
          closeLabel="Close help"
        >
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
