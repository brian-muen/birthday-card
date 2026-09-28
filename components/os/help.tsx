"use client";

import { useRef } from "react";

import OsWindow from "@/components/os/os-window";

const QUESTIONS = [
  {
    q: "What is Birthday Mail?",
    a: "A group birthday card that arrives like email. One person starts the card, friends each write a note, and the birthday person opens the notes as messages, then turns them into a paper card.",
  },
  {
    q: "How do I start a card?",
    a: "Write a new message on the home screen: who it’s for, an optional note for the people signing, and a cover and paper. Send gives you the links to share.",
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
    a: "When the organizer sends them the gift link. Nothing is scheduled; sharing the link is the delivery.",
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
    a: "Yes. Save PDF keepsake, in the File menu or on the desktop of the card, downloads the whole card.",
  },
  {
    q: "Do I need an account?",
    a: "No. Signing and reading never need one. Organizers can sign in with Google to save a card and find its links again; otherwise a lost organizer link can’t be recovered.",
  },
];

export default function HelpButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="os-menu-trigger os-help-trigger"
        aria-label="Help"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        ?
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
