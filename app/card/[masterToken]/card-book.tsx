"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { deleteMessage } from "@/app/actions/delete-message";
import { penIsLively, penNoteClass, penVar, type PenId } from "@/lib/pen";
import { stockHex } from "@/lib/stock";
import MessageReader from "@/components/message-reader";

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
  pen: PenId;
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
  return lastNotePlace(leaves, spread, noteCount);
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
}: {
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  notes: Note[];
  stock: string;
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
  const last = lastPlace(leaves, spread, notes.length);

  // A place is the number of leaves turned. One transition owns each move;
  // a second input is retained as one queued action and consumed on settle.
  type Action = { kind: "turn"; delta: 1 | -1 } | { kind: "close" };
  const [{ place: rawPlace, moving, touched, closing, pending }, setPlace] =
    useState<{
      place: number;
      moving: number | null;
      touched: boolean;
      closing: boolean;
      pending: Action | null;
    }>({ place: 0, moving: null, touched: false, closing: false, pending: null });

  const place = Math.min(rawPlace, last);
  const closed = place === 0;
  const request = useCallback((action: Action) => {
    setPlace((previous) => {
      if (previous.moving !== null || previous.closing) {
        return { ...previous, pending: action, touched: true };
      }
      if (action.kind === "close") {
        if (previous.place === 0) return previous;
        return { ...previous, closing: true, touched: true };
      }
      const next = Math.min(last, Math.max(0, previous.place + action.delta));
      if (next === previous.place) return previous;
      return {
        ...previous,
        place: next,
        moving: reducedMotion ? null : action.delta === 1 ? previous.place : next,
        touched: true,
      };
    });
  }, [last, reducedMotion]);

  const turn = useCallback((delta: 1 | -1) => request({ kind: "turn", delta }), [request]);
  const closeCard = useCallback(() => request({ kind: "close" }), [request]);

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(() => setPlace((previous) => ({
      ...previous, place: 0, moving: null, closing: false, pending: null,
    })), reducedMotion ? 0 : 700);
    return () => window.clearTimeout(timeout);
  }, [closing, reducedMotion]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (closing) {
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowRight") {
        if (place >= last && notes.length > 0) closeCard();
        else turn(1);
      } else if (event.key === "ArrowLeft") {
        if (place === 1) closeCard();
        else turn(-1);
      } else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turn, closeCard, place, last, closing]);

  function settle(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;
    setPlace((previous) => {
      if (previous.moving === null) return previous;
      const action = previous.pending;
      if (!action) return { ...previous, moving: null };
      if (action.kind === "close") {
        return { ...previous, moving: null, pending: null, closing: true };
      }
      const next = Math.min(last, Math.max(0, previous.place + action.delta));
      return {
        ...previous,
        place: next,
        moving: reducedMotion ? null : action.delta === 1 ? previous.place : next,
        pending: null,
      };
    });
  }

  function settleClose(
    event:
      | React.AnimationEvent<HTMLDivElement>
      | React.TransitionEvent<HTMLDivElement>,
  ) {
    if (event.target !== event.currentTarget) return;
    if ("propertyName" in event && event.propertyName !== "transform") return;
    setPlace((previous) => ({ ...previous, place: 0, moving: null, closing: false, pending: null }));
  }

  const leftFace = spread && place > 0 ? leaves[place - 1]?.back : undefined;
  const rightFace = closed ? leaves[0]?.front : leaves[place]?.front;
  const announcement = closing
    ? "Closing the card"
    : closed
      ? `Birthday card for ${recipientName}, closed`
      : [describeFace(leftFace), describeFace(rightFace)]
          .filter(Boolean)
          .filter((item, index, all) => all.indexOf(item) === index)
          .join(". ") || `Inside ${recipientName}'s card`;
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <div>
      <div
        className="card-frame"
        data-spread={spread}
        data-animate={touched}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start || closing) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
          if (dx < 0) {
            if (place >= last && notes.length > 0) closeCard();
            else turn(1);
          } else if (place <= 1) closeCard();
          else turn(-1);
        }}
        style={{
          ["--card-stock" as string]: stockHex(stock),
        }}
      >
        <div
          className="card-stage"
          data-closed={closed}
          data-closing={closing}
          data-shut="front"
        >
          <div aria-hidden className="card-panel" data-half="right">
            <span className="card-crease" data-side="right" />
          </div>

          {spread ? (
            <div aria-hidden className="card-panel" data-half="left">
              <span className="card-crease" data-side="left" />
            </div>
          ) : null}

          {leaves.map((leaf, index) => {
                const foldingShut = closing && index === place;
                const turned = index < place || foldingShut;
                const facingFront = closed
                  ? index === 0
                  : index === place;
                const facingBack = place > 0 && index === place - 1;
                const inMotion = moving === index || foldingShut;
                const painted =
                  inMotion ||
                  index === place ||
                  index === place - 1 ||
                  (closed && index === 0);

                return (
                  <div
                    key={index}
                    className="card-leaf"
                    data-cover={index === 0}
                    data-folding={foldingShut}
                    data-turned={turned}
                    data-moving={inMotion}
                    onTransitionEnd={foldingShut ? settleClose : settle}
                    style={{
                      visibility: painted ? "visible" : "hidden",
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
                      face={foldingShut ? { kind: "empty" } : leaf.back}
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

          {closing && !leaves[place] ? (
            <div
              className="card-shutter"
              data-swing="true"
              onAnimationEnd={settleClose}
            >
              <div
                className="card-face"
                data-face="front"
                data-stock="cover"
                aria-hidden
              >
                <span className="card-crease" data-side="right" aria-hidden />
                <span className="card-body" />
              </div>
              <div className="card-face" data-face="back" aria-hidden>
                <span className="card-crease" data-side="left" aria-hidden />
                <span className="card-body" />
              </div>
            </div>
          ) : null}

          {!closed && !spread && notes.length === 0 ? (
            <div className="card-insert">
              <span className="card-crease" data-side="right" aria-hidden />
              <InsideFace recipientName={recipientName} canManage={canManage} />
            </div>
          ) : null}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <nav aria-label="Card" className="mt-9 min-h-11">
        {closed || closing ? null : (
          <div className="flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => {
                if (place === 1) closeCard();
                else turn(-1);
              }}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
            >
              {place === 1 ? "Close the card" : "Previous"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (place >= last && notes.length > 0) closeCard();
                else turn(1);
              }}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
            >
              {place >= last ? "Close the card" : "Next"}
            </button>
          </div>
        )}
      </nav>
      <div className="card-progress" aria-label={`Page ${place} of ${last}`} role="group">
        <span>{closed ? "Cover" : `Page ${place} of ${last}`}</span>
      </div>
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
          inert={!towardReader}
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
      inert={!towardReader}
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
          showDedication={!canManage}
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
  showDedication,
  noteCount,
  showCount,
}: {
  recipientName: string;
  showDedication: boolean;
  noteCount: number;
  showCount: boolean;
}) {
  return (
    <span className="card-body items-center px-7 pt-8 pb-14 text-center sm:px-9 sm:pt-9 sm:pb-16">
      <span className="my-auto flex flex-col items-center">
        <span className="font-hand text-[1.0625rem] text-muted">
          Happy birthday,
        </span>
        <span
          className={`mt-2 font-hand leading-[1.02] tracking-[-0.02em] break-words ${coverTypeSize(recipientName)}`}
        >
          {recipientName}
        </span>
        <span className="mt-7 h-px w-10 bg-brass/80" />
        {showDedication ? (
          <span className="mt-8 max-w-[22ch] font-hand text-[0.9375rem] leading-[1.55] text-ink/80">
            From your brothers and sisters in Christ
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
    <div
      className={`card-body ${pad}`}
      style={{ ["--card-face" as string]: penVar(note.pen) }}
    >
      <div className="card-scroll flex flex-col" tabIndex={0}>
        <div className="my-auto" style={{ color: `rgb(27 36 64 / ${inkFor(note.body)})` }}>
          <MessageReader body={note.body} authorName={note.authorName} pen={note.pen} />
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-6">
        {canManage ? (
          <RemoveControl masterToken={masterToken} messageId={note.id} />
        ) : (
          <span />
        )}
        <div className="text-right">
          <span aria-hidden="true" className="hidden"><Signature name={note.authorName} pen={note.pen} /></span>
          <p className="mt-2 text-[0.75rem] text-muted">{note.date}</p>
        </div>
      </div>
    </div>
  );
}

function Signature({ name, pen }: { name: string; pen: PenId }) {
  const hand = handFor(name);
  const lively = penIsLively(pen);
  return (
    <p
      className="font-card leading-none text-ink/90"
      style={{
        fontSize: lively ? `${hand.size}rem` : "1.25rem",
        transform: lively
          ? `rotate(${hand.rotate}deg) skewX(${hand.skew}deg)`
          : undefined,
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
