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
import { penVar, type PenId } from "@/lib/pen";
import { stockHex } from "@/lib/stock";
import CoverArt from "@/components/cover-art";
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
  | { kind: "dedication" }
  | { kind: "note"; note: Note }
  | { kind: "empty" };

type Leaf = { front: Face; back: Face };

type View =
  | { kind: "cover" }
  | { kind: "dedication" }
  | { kind: "note"; id: number };

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
    window.addEventListener("resize", onChange);
    return () => {
      list.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
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

function inkFor(text: string) {
  return 0.8 + (hashOf(text) % 16) / 100;
}

function coverTypeSize(name: string) {
  if (name.length > 24) return "text-[1.625rem] sm:text-[1.875rem]";
  if (name.length > 13) return "text-[2rem] sm:text-[2.375rem]";
  return "text-[2.375rem] sm:text-[2.875rem]";
}

function isChromeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, a, summary, input, textarea, select, label"),
  );
}

function hasTextSelection() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
}

/**
 * Dedication is always the first inner leaf. Desktop then pairs notes
 * across the spread (dedication | first note, then the rest). Mobile
 * keeps one face per leaf so the writing turns with the page.
 */
function buildLeaves(notes: Note[], spread: boolean): Leaf[] {
  if (!spread) {
    return [
      { front: { kind: "cover" }, back: { kind: "empty" } },
      { front: { kind: "dedication" }, back: { kind: "empty" } },
      ...notes.map((note) => ({
        front: { kind: "note" as const, note },
        back: { kind: "empty" as const },
      })),
    ];
  }

  if (notes.length === 0) {
    return [
      { front: { kind: "cover" }, back: { kind: "dedication" } },
      { front: { kind: "empty" }, back: { kind: "empty" } },
    ];
  }

  const leaves: Leaf[] = [
    { front: { kind: "cover" }, back: { kind: "dedication" } },
    {
      front: { kind: "note", note: notes[0] },
      back: notes[1] ? { kind: "note", note: notes[1] } : { kind: "empty" },
    },
  ];
  for (let i = 2; i < notes.length; i += 2) {
    leaves.push({
      front: { kind: "note", note: notes[i] },
      back: notes[i + 1]
        ? { kind: "note", note: notes[i + 1] }
        : { kind: "empty" },
    });
  }
  return leaves;
}

function lastPlace(leaves: Leaf[], spread: boolean, noteCount: number) {
  if (!spread) return 1 + noteCount;
  if (noteCount === 0) return 1;
  let max = 1;
  for (let i = 1; i < leaves.length; i += 1) {
    const revealsLeft = leaves[i].back.kind === "note";
    const revealsRight = leaves[i + 1]?.front.kind === "note";
    if (revealsLeft || revealsRight) max = i + 1;
  }
  return max;
}

function visibleView(leaves: Leaf[], spread: boolean, place: number): View {
  if (place <= 0) return { kind: "cover" };
  if (spread) {
    const left = leaves[place - 1]?.back;
    const right = leaves[place]?.front;
    if (right?.kind === "note") return { kind: "note", id: right.note.id };
    if (left?.kind === "note") return { kind: "note", id: left.note.id };
    return { kind: "dedication" };
  }
  const front = leaves[place]?.front;
  if (front?.kind === "note") return { kind: "note", id: front.note.id };
  if (front?.kind === "dedication") return { kind: "dedication" };
  return { kind: "cover" };
}

function placeForView(
  leaves: Leaf[],
  spread: boolean,
  view: View,
  last: number,
) {
  if (view.kind === "cover") return 0;
  if (view.kind === "dedication") return Math.min(1, last);
  for (let place = 1; place <= last; place += 1) {
    if (spread) {
      const left = leaves[place - 1]?.back;
      const right = leaves[place]?.front;
      if (left?.kind === "note" && left.note.id === view.id) return place;
      if (right?.kind === "note" && right.note.id === view.id) return place;
    } else {
      const front = leaves[place]?.front;
      if (front?.kind === "note" && front.note.id === view.id) return place;
    }
  }
  return Math.min(1, last);
}

function describeFace(face: Face | undefined) {
  if (!face) return null;
  if (face.kind === "note") return `Note from ${face.note.authorName}`;
  if (face.kind === "dedication") return "Dedication";
  if (face.kind === "cover") return "Front cover";
  return null;
}

function faceStock(face: Face) {
  if (face.kind === "cover") return "cover";
  return "liner";
}

export default function CardBook({
  masterToken,
  canManage,
  recipientName,
  notes,
  stock,
  design = "plain",
}: {
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  notes: Note[];
  stock: string;
  design?: string;
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

  // Viewed face is the source of truth so a resize can remount the same note
  // on the other leaf model. Place is derived from that view.
  type Action = { kind: "turn"; delta: 1 | -1 } | { kind: "close" };
  type Nav = {
    view: View;
    moving: number | null;
    touched: boolean;
    closing: boolean;
    pending: Action | null;
    spread: boolean;
  };

  const applyAction = useCallback((previous: Nav, action: Action): Nav => {
    const currentPlace = placeForView(leaves, spread, previous.view, last);
    if (action.kind === "close") {
      if (currentPlace === 0) return { ...previous, spread, pending: null };
      if (reducedMotion) {
        return {
          ...previous,
          spread,
          view: { kind: "cover" },
          moving: null,
          closing: false,
          pending: null,
          touched: true,
        };
      }
      return {
        ...previous,
        spread,
        view: { kind: "cover" },
        moving: 0,
        closing: true,
        pending: null,
        touched: true,
      };
    }
    const nextPlace = Math.min(last, Math.max(0, currentPlace + action.delta));
    if (nextPlace === currentPlace) return { ...previous, spread, pending: null };
    return {
      ...previous,
      spread,
      view: visibleView(leaves, spread, nextPlace),
      moving: reducedMotion ? null : action.delta === 1 ? currentPlace : nextPlace,
      closing: false,
      pending: null,
      touched: true,
    };
  }, [leaves, last, reducedMotion, spread]);

  const [nav, setNav] = useState<Nav>({
    view: { kind: "cover" },
    moving: null,
    touched: false,
    closing: false,
    pending: null,
    spread,
  });

  if (nav.spread !== spread) {
    setNav((previous) => ({
      ...previous,
      spread,
      moving: null,
      closing: false,
      pending: null,
      touched: false,
    }));
  }

  const place = placeForView(leaves, spread, nav.view, last);
  const { moving, touched, closing } = nav;
  const closed = place === 0;

  const request = useCallback((action: Action) => {
    setNav((previous) => {
      if (previous.moving !== null || previous.closing) {
        return { ...previous, pending: action, touched: true };
      }
      return applyAction(previous, action);
    });
  }, [applyAction]);

  const turn = useCallback((delta: 1 | -1) => request({ kind: "turn", delta }), [request]);
  const closeCard = useCallback(() => request({ kind: "close" }), [request]);

  const finishMove = useCallback(() => {
    setNav((previous) => {
      if (previous.moving === null) return previous;
      if (previous.pending) return applyAction(previous, previous.pending);
      return { ...previous, moving: null, closing: false };
    });
  }, [applyAction]);

  useEffect(() => {
    if (moving === null) return;
    const duration = closing ? 780 : moving === 0 ? 900 : 640;
    const timeout = window.setTimeout(finishMove, reducedMotion ? 0 : duration);
    return () => window.clearTimeout(timeout);
  }, [moving, closing, reducedMotion, finishMove]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (closing) {
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowRight") {
        if (place >= last) closeCard();
        else turn(1);
      } else if (event.key === "ArrowLeft") {
        if (place <= 1) closeCard();
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
    finishMove();
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
  const suppressClick = useRef(false);

  function goForward() {
    if (place >= last) closeCard();
    else turn(1);
  }

  function goBack() {
    if (place <= 1) closeCard();
    else turn(-1);
  }

  function activatePage(direction: 1 | -1) {
    if (closing) return;
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (direction === 1) goForward();
    else goBack();
  }

  const noteCountLabel =
    notes.length === 0
      ? "Nothing inside yet"
      : notes.length === 1
        ? "One note"
        : `${notes.length} notes`;

  return (
    <div>
      <div
        className="card-frame"
        data-spread={spread}
        data-animate={touched}
        onPointerDown={(event) => {
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start || closing) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (event.pointerType === "mouse") return;
          if (Math.hypot(dx, dy) > 14) suppressClick.current = true;
          if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
          if (dx < 0) goForward();
          else goBack();
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
        style={{
          ["--card-stock" as string]: stockHex(stock),
        }}
      >
        <div className="card-seat">
          <div
            className="card-stage"
            data-closed={closed}
            data-closing={closing}
          >
            <div aria-hidden className="card-panel" data-half="right">
              <span className="card-crease" data-side="right" />
              <span className="card-fold-shade" />
            </div>

            {spread ? (
              <div aria-hidden className="card-panel" data-half="left">
                <span className="card-crease" data-side="left" />
                <span className="card-fold-shade" />
              </div>
            ) : null}

            {leaves.map((leaf, index) => {
              const turned = index < place;
              const facingFront = closed ? index === 0 : index === place;
              const facingBack = Boolean(spread && place > 0 && index === place - 1);
              const inMotion = moving === index;
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
                  data-turned={turned}
                  data-moving={inMotion}
                  onTransitionEnd={settle}
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
                    design={design}
                    onOpen={index === 0 ? () => activatePage(1) : undefined}
                    onPageTurn={index === 0 ? undefined : () => activatePage(1)}
                  />
                  <LeafFace
                    face={leaf.back}
                    side="left"
                    facing={facingBack}
                    turning={inMotion}
                    masterToken={masterToken}
                    canManage={canManage}
                    recipientName={recipientName}
                    design={design}
                    onPageTurn={() => activatePage(-1)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <nav aria-label="Card" className="card-nav">
        {canManage ? (
          <p className="card-nav-meta">
            {notes.length === 0
              ? closed
                ? "Nothing inside yet"
                : `Nobody has signed ${recipientName}’s card yet. Share the signing link and every note will land in here.`
              : noteCountLabel}
          </p>
        ) : null}
        {closed || closing ? null : (
          <div className="card-nav-row">
            <button type="button" onClick={goBack} className="card-nav-link">
              {place <= 1 ? "Close" : "Previous"}
            </button>
            <button type="button" onClick={goForward} className="card-nav-link">
              {place >= last ? "Close" : "Next"}
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
  design,
  face,
  side,
  facing,
  turning,
  masterToken,
  canManage,
  recipientName,
  onOpen,
  onPageTurn,
}: {
  design: string;
  face: Face;
  side: "left" | "right";
  facing: boolean;
  turning: boolean;
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  onOpen?: () => void;
  onPageTurn?: () => void;
}) {
  const towardReader = facing || turning;
  const crease = <span className="card-crease" data-side={side} aria-hidden />;
  const contents = (
    <>
      {crease}
      <span className="card-light" aria-hidden />
      <FaceContents
        design={design}
        face={face}
        side={side}
        masterToken={masterToken}
        canManage={canManage}
        recipientName={recipientName}
      />
    </>
  );

  function handlePageClick(event: React.MouseEvent<HTMLElement>) {
    if (!onPageTurn || !facing) return;
    if (isChromeTarget(event.target) || hasTextSelection()) return;
    onPageTurn();
  }

  if (face.kind === "cover") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="card-face"
        data-face="front"
        data-stock="cover"
        aria-label={`Open ${recipientName}'s birthday card`}
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
      data-stock={faceStock(face)}
      aria-hidden={!towardReader}
      inert={!towardReader}
      onClick={handlePageClick}
    >
      {contents}
    </div>
  );
}

function FaceContents({
  design,
  face,
  side,
  masterToken,
  canManage,
  recipientName,
}: {
  design: string;
  face: Face;
  side: "left" | "right";
  masterToken: string;
  canManage: boolean;
  recipientName: string;
}) {
  switch (face.kind) {
    case "cover":
      return <CoverFace recipientName={recipientName} design={design} />;
    case "dedication":
      return (
        <div className="card-body card-dedication">
          <p>From your brothers and sisters in Christ</p>
        </div>
      );
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

function CoverFace({ recipientName, design }: { recipientName: string; design: string }) {
  return (
    <span className="card-body card-cover">
      <span className="card-cover-mark" aria-hidden="true" />
      <CoverArt design={design} className="card-cover-art" />
      <span className="card-cover-greeting">Happy birthday</span>
      <span className={`card-cover-name ${coverTypeSize(recipientName)}`}>
        {recipientName}
      </span>
    </span>
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
      <div className="min-h-0 flex-1">
        <div className="h-full" style={{ color: `rgb(27 36 64 / ${inkFor(note.body)})` }}>
          <MessageReader body={note.body} authorName={note.authorName} pen={note.pen} />
        </div>
      </div>

      {canManage ? (
        <div className="mt-8">
          <RemoveControl masterToken={masterToken} messageId={note.id} />
        </div>
      ) : null}
    </div>
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
