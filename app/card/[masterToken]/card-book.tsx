"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { deleteMessage } from "@/app/actions/delete-message";
import { stockHex } from "@/lib/stock";

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
};

type Face =
  | { kind: "cover" }
  | { kind: "inside" }
  | { kind: "note"; note: Note }
  | { kind: "empty" };

type Leaf = { front: Face; back: Face };

/**
 * Below this the open card is a single panel. Above it, a greeting-card
 * bifold with a note on each side.
 */
const SPREAD_QUERY = "(min-width: 52rem)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}
const subscribeToSpread = subscribeTo(SPREAD_QUERY);
const subscribeToMotion = subscribeTo(MOTION_QUERY);
const getSpread = () => window.matchMedia(SPREAD_QUERY).matches;
const getReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
const getServerFalse = () => false;

function hashOf(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) % 10007;
  }
  return hash;
}

// Real signatures never line up. Size, slant, and tilt stay stable per name.
function handFor(name: string) {
  const hash = hashOf(name);
  return {
    rotate: ((hash % 13) - 6) * 0.55,
    skew: (((hash / 13) | 0) % 9) - 4,
    size: 1.55 + ((((hash / 117) | 0) % 6) * 0.14),
  };
}

function inkFor(text: string) {
  return 0.8 + (hashOf(text) % 16) / 100;
}

function coverTypeSize(name: string) {
  if (name.length > 24) return "text-[1.625rem] sm:text-[1.875rem]";
  if (name.length > 13) return "text-[2rem] sm:text-[2.375rem]";
  return "text-[2.375rem] sm:text-[2.875rem]";
}

/**
 * Desktop leaves are two-sided, so each opening shows two notes.
 * Cover back is the first note; the next leaf's front is the second; turning
 * that leaf puts its back on the left and the following front on the right.
 *
 * On a phone each note is its own leaf, stacked on the panel, so the
 * writing turns away with the page instead of swapping after the turn.
 */
function buildLeaves(notes: Note[], spread: boolean): Leaf[] {
  if (notes.length === 0) {
    return [{ front: { kind: "cover" }, back: { kind: "inside" } }];
  }

  if (!spread) {
    return [
      { front: { kind: "cover" }, back: { kind: "empty" } },
      ...notes.map((note) => ({
        front: { kind: "note" as const, note },
        back: { kind: "empty" as const },
      })),
    ];
  }

  const leaves: Leaf[] = [
    { front: { kind: "cover" }, back: { kind: "note", note: notes[0] } },
  ];
  for (let i = 1; i < notes.length; i += 2) {
    leaves.push({
      front: { kind: "note", note: notes[i] },
      back: notes[i + 1]
        ? { kind: "note", note: notes[i + 1] }
        : { kind: "empty" },
    });
  }
  return leaves;
}

function lastNotePlace(leaves: Leaf[], spread: boolean, noteCount: number) {
  if (!spread) return Math.max(1, noteCount);
  let max = 1;
  for (let i = 1; i < leaves.length; i += 1) {
    const revealsLeft = leaves[i].back.kind === "note";
    const revealsRight = leaves[i + 1]?.front.kind === "note";
    if (revealsLeft || revealsRight) max = i + 1;
  }
  return max;
}

function lastPlace(leaves: Leaf[], spread: boolean, noteCount: number) {
  const notesEnd = lastNotePlace(leaves, spread, noteCount);
  return noteCount > 0 ? notesEnd + 1 : notesEnd;
}

function describeFace(face: Face | undefined) {
  if (!face) return null;
  if (face.kind === "note") return `Note from ${face.note.authorName}`;
  if (face.kind === "inside") return "Inside the card";
  if (face.kind === "cover") return "Front cover";
  return null;
}

export default function CardBook({
  masterToken,
  canManage,
  recipientName,
  intro,
  notes,
  stock,
  pdfHref,
}: {
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  notes: Note[];
  stock: string;
  pdfHref: string;
}) {
  const spread = useSyncExternalStore(
    subscribeToSpread,
    getSpread,
    getServerFalse,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotion,
    getServerFalse,
  );

  const leaves = useMemo(() => buildLeaves(notes, spread), [notes, spread]);
  const notesEnd = lastNotePlace(leaves, spread, notes.length);
  const last = lastPlace(leaves, spread, notes.length);

  // 0 is the closed cover. Each step after that turns one more leaf.
  const [{ place: rawPlace, moving, touched }, setPlace] = useState<{
    place: number;
    moving: number | null;
    touched: boolean;
  }>({ place: 0, moving: null, touched: false });

  const place = Math.min(rawPlace, last);
  const closed = place === 0;
  const atKeep = notes.length > 0 && place === last && !closed;
  const showPlace = atKeep ? notesEnd : place;

  const turn = useCallback(
    (delta: 1 | -1) => {
      setPlace((previous) => {
        const from = Math.min(previous.place, last);
        const next = from + delta;
        if (next < 0 || next > last) return previous;
        const keepMove =
          (from === last && next === last - 1) ||
          (from === last - 1 && next === last && notes.length > 0);
        return {
          place: next,
          moving: reducedMotion || keepMove
            ? null
            : delta === 1
              ? from
              : next,
          touched: true,
        };
      });
    },
    [last, notes.length, reducedMotion],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (event.key === "ArrowRight") turn(1);
      else if (event.key === "ArrowLeft") turn(-1);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turn]);

  function settle(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;
    setPlace((previous) =>
      previous.moving === null ? previous : { ...previous, moving: null },
    );
  }

  const leftFace = spread && showPlace > 0 ? leaves[showPlace - 1]?.back : undefined;
  const rightFace = closed
    ? leaves[0]?.front
    : spread
      ? leaves[showPlace]?.front
      : leaves[showPlace]?.front;

  const announcement = atKeep
    ? "Manna loves you. Make sure to save the PDF."
    : closed
      ? `Birthday card for ${recipientName}, closed`
      : [describeFace(leftFace), describeFace(rightFace)]
          .filter(Boolean)
          .filter((item, index, all) => all.indexOf(item) === index)
          .join(". ") || `Inside ${recipientName}'s card`;

  return (
    <div>
      <div
        className="card-frame"
        data-spread={spread}
        data-animate={touched}
        style={{ ["--card-stock" as string]: stockHex(stock) }}
      >
        <div className="card-stage" data-closed={closed}>
          <div aria-hidden className="card-panel" data-half="right">
            <span className="card-crease" data-side="right" />
          </div>

          {spread ? (
            <div aria-hidden className="card-panel" data-half="left">
              <span className="card-crease" data-side="left" />
            </div>
          ) : null}

          {leaves.map((leaf, index) => {
            const turned = index < showPlace;
            const facingFront = closed
              ? index === 0
              : index === showPlace;
            const facingBack = showPlace > 0 && index === showPlace - 1;
            const inMotion = moving === index;

            return (
              <div
                key={index}
                className="card-leaf"
                data-cover={index === 0}
                data-turned={turned}
                data-moving={inMotion}
                onTransitionEnd={settle}
                style={{
                  zIndex: inMotion
                    ? leaves.length + 20
                    : turned
                      ? index + 1
                      : leaves.length - index,
                }}
              >
                <LeafFace
                  face={leaf.front}
                  side="right"
                  facing={facingFront}
                  turning={inMotion}
                  masterToken={masterToken}
                  canManage={canManage}
                  recipientName={recipientName}
                  intro={intro}
                  notes={notes}
                  onOpen={index === 0 ? () => turn(1) : undefined}
                />
                <LeafFace
                  face={leaf.back}
                  side="left"
                  facing={facingBack}
                  turning={inMotion}
                  masterToken={masterToken}
                  canManage={canManage}
                  recipientName={recipientName}
                  intro={intro}
                  notes={notes}
                />
              </div>
            );
          })}

          {!closed && (atKeep || (!spread && notes.length === 0)) ? (
            <div
              key={atKeep ? "keep" : "inside"}
              className={
                "card-insert " +
                (showPlace > 1 ? "animate-insert-in" : "")
              }
              data-span={atKeep && spread ? "card" : undefined}
            >
              <span className="card-crease" data-side="right" aria-hidden />
              {atKeep ? (
                <KeepFace pdfHref={pdfHref} />
              ) : (
                <InsideFace recipientName={recipientName} canManage={canManage} />
              )}
            </div>
          ) : null}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <nav aria-label="Card" className="mt-9 min-h-11">
        {closed ? null : (
          <div className="flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => turn(-1)}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
            >
              {place === 1 ? "Close the card" : "Previous"}
            </button>

            <button
              type="button"
              onClick={() => turn(1)}
              disabled={place >= last}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass disabled:pointer-events-none disabled:opacity-0"
            >
              Next
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

function LeafFace({
  face,
  side,
  facing,
  turning,
  masterToken,
  canManage,
  recipientName,
  intro,
  notes,
  onOpen,
}: {
  face: Face;
  side: "left" | "right";
  facing: boolean;
  turning: boolean;
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  notes: Note[];
  onOpen?: () => void;
}) {
  const towardReader = facing || turning;
  const stock =
    face.kind === "cover" ? "cover" : face.kind === "inside" ? "liner" : undefined;
  const crease = (
    <span className="card-crease" data-side={side} aria-hidden />
  );
  const contents = (
    <>
      {crease}
      <FaceContents
        face={face}
        side={side}
        masterToken={masterToken}
        canManage={canManage}
        recipientName={recipientName}
        intro={intro}
        notes={notes}
      />
    </>
  );

  if (face.kind === "cover") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="card-face group cursor-pointer"
        data-face="front"
        data-stock="cover"
        aria-hidden={!towardReader}
        tabIndex={facing ? 0 : -1}
      >
        {contents}
      </button>
    );
  }

  return (
    <div
      className="card-face"
      data-face={side === "left" ? "back" : "front"}
      data-stock={stock}
      aria-hidden={!towardReader}
    >
      {contents}
    </div>
  );
}

function FaceContents({
  face,
  side,
  masterToken,
  canManage,
  recipientName,
  intro,
  notes,
}: {
  face: Face;
  side: "left" | "right";
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  notes: Note[];
}) {
  switch (face.kind) {
    case "cover":
      return (
        <CoverFace
          recipientName={recipientName}
          intro={intro}
          noteCount={notes.length}
          showCount={canManage}
        />
      );
    case "inside":
      return <InsideFace recipientName={recipientName} canManage={canManage} />;
    case "note":
      return (
        <NoteFace
          masterToken={masterToken}
          canManage={canManage}
          note={face.note}
          side={side}
        />
      );
    case "empty":
      return <div className="card-body" />;
  }
}

function CoverFace({
  recipientName,
  intro,
  noteCount,
  showCount,
}: {
  recipientName: string;
  intro: string | null;
  noteCount: number;
  showCount: boolean;
}) {
  return (
    <span className="card-body items-center px-7 pt-8 pb-14 text-center sm:px-9 sm:pt-9 sm:pb-16">
      <span className="my-auto flex flex-col items-center">
        <span className="font-serif text-[1.0625rem] italic text-muted">
          Happy birthday,
        </span>
        <span
          className={`mt-2 font-serif leading-[1.02] tracking-[-0.02em] break-words ${coverTypeSize(recipientName)}`}
        >
          {recipientName}
        </span>
        <span className="mt-7 h-px w-10 bg-brass/80" />
        {intro ? (
          <span className="mt-8 max-w-[28ch] font-serif text-[0.9375rem] leading-[1.55] text-ink/80 whitespace-pre-wrap">
            {intro}
          </span>
        ) : null}
      </span>

      <span className="flex flex-col items-center text-[0.8125rem]">
        {showCount ? (
          <span className="text-muted">
            {noteCount === 0
              ? "Nothing inside yet"
              : noteCount === 1
                ? "One note inside"
                : `${noteCount} notes inside`}
          </span>
        ) : null}
        <span className={`font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors group-hover:decoration-brass ${showCount ? "mt-2.5" : ""}`}>
          Open the card
        </span>
      </span>
    </span>
  );
}

function KeepFace({ pdfHref }: { pdfHref: string }) {
  return (
    <div className="card-body items-center px-8 py-10 text-center sm:px-12 sm:py-12">
      <div className="my-auto flex flex-col items-center">
        <a
          href={pdfHref}
          download
          className="font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          Make sure to save the PDF!!
        </a>
        <p
          className="mt-10 font-hand leading-none text-ink/90"
          style={{
            fontSize: "2.15rem",
            transform: "rotate(-1.4deg) skewX(-2deg)",
          }}
        >
          Manna loves you!
        </p>
      </div>
    </div>
  );
}

function InsideFace({
  recipientName,
  canManage,
}: {
  recipientName: string;
  canManage: boolean;
}) {
  if (!canManage) {
    return <div className="card-body px-7 py-8 sm:px-10 sm:py-10" />;
  }

  return (
    <div className="card-body px-7 py-8 sm:px-10 sm:py-10">
      <p className="my-auto leading-relaxed text-muted">
        Nobody has signed {recipientName}&rsquo;s card yet. Share the signing
        link and every note will land in here.
      </p>
    </div>
  );
}

function NoteFace({
  masterToken,
  canManage,
  note,
  side,
}: {
  masterToken: string;
  canManage: boolean;
  note: Note;
  side: "left" | "right";
}) {
  const pad =
    side === "left"
      ? "pl-7 pr-9 py-8 sm:pl-8 sm:pr-11 sm:py-10"
      : "pl-9 pr-7 py-8 sm:pl-11 sm:pr-8 sm:py-10";

  return (
    <div className={`card-body ${pad}`}>
      <div className="card-scroll flex flex-col" tabIndex={0}>
        <p
          className="my-auto font-serif text-[1.1875rem] leading-[1.62] whitespace-pre-wrap break-words sm:text-[1.25rem]"
          style={{ color: `rgb(27 36 64 / ${inkFor(note.body)})` }}
        >
          {note.body}
        </p>
      </div>

      <div className="mt-8 flex items-end justify-between gap-6">
        {canManage ? (
          <RemoveControl masterToken={masterToken} messageId={note.id} />
        ) : (
          <span />
        )}
        <div className="text-right">
          <Signature name={note.authorName} />
          <p className="mt-2 text-[0.75rem] text-muted">{note.date}</p>
        </div>
      </div>
    </div>
  );
}

function Signature({ name }: { name: string }) {
  const hand = handFor(name);
  return (
    <p
      className="font-hand leading-none text-ink/90"
      style={{
        fontSize: `${hand.size}rem`,
        transform: `rotate(${hand.rotate}deg) skewX(${hand.skew}deg)`,
      }}
    >
      {name}
    </p>
  );
}

function RemoveControl({
  masterToken,
  messageId,
}: {
  masterToken: string;
  messageId: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMessage(masterToken, messageId);
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-muted">
        <span>
          {error ?? (isPending ? "Removing…" : "Remove this note for good?")}
        </span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isPending}
          className="font-medium text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-brass disabled:opacity-50"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="underline decoration-rule decoration-2 underline-offset-4 hover:decoration-brass disabled:opacity-50"
        >
          Keep it
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[0.75rem] text-muted underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brass"
    >
      Remove this note
    </button>
  );
}
