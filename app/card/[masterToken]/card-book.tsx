"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { deleteMessage } from "@/app/actions/delete-message";
import { resolveDedication } from "@/lib/dedication";
import { penVar, type PenId } from "@/lib/pen";
import CoverSurface from "@/components/cover-surface";
import MessageReader from "@/components/message-reader";
import {
  CardObject,
  CardSheet,
  FaceChrome,
  getReducedMotion,
  getServerFalse,
  getSpread,
  subscribeToMotion,
  subscribeToSpread,
} from "@/components/folded-card";
import { useCardTurn } from "@/components/use-card-turn";

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
  pen: PenId;
  image?: string | null;
};

type Face =
  | { kind: "cover" }
  | { kind: "dedication" }
  | { kind: "note"; note: Note }
  | { kind: "empty" }
  | { kind: "back" };

type Leaf = { front: Face; back: Face };

type View =
  | { kind: "cover" }
  | { kind: "dedication" }
  | { kind: "note"; id: number };

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

function withBackCover(leaves: Leaf[]): Leaf[] {
  const last = leaves[leaves.length - 1];
  if (!last) {
    return [{ front: { kind: "cover" }, back: { kind: "back" } }];
  }
  if (last.back.kind === "back") return leaves;
  if (last.front.kind === "empty" && last.back.kind === "empty") {
    return [
      ...leaves.slice(0, -1),
      { front: { kind: "empty" }, back: { kind: "back" } },
    ];
  }
  return [...leaves, { front: { kind: "empty" }, back: { kind: "back" } }];
}

/**
 * Dedication is the first inner leaf when a card has one. Desktop then
 * pairs notes across the spread. Mobile keeps one face per leaf so the
 * writing turns with the page.
 */
function buildLeaves(
  notes: Note[],
  spread: boolean,
  hasDedication: boolean,
): Leaf[] {
  if (!spread) {
    const leaves: Leaf[] = [
      { front: { kind: "cover" }, back: { kind: "empty" } },
    ];
    if (hasDedication) {
      leaves.push({ front: { kind: "dedication" }, back: { kind: "empty" } });
    } else if (notes.length === 0) {
      leaves.push({ front: { kind: "empty" }, back: { kind: "empty" } });
    }
    leaves.push(
      ...notes.map((note) => ({
        front: { kind: "note" as const, note },
        back: { kind: "empty" as const },
      })),
    );
    return withBackCover(leaves);
  }

  const coverBack: Face = hasDedication
    ? { kind: "dedication" }
    : { kind: "empty" };

  if (notes.length === 0) {
    return withBackCover([
      { front: { kind: "cover" }, back: coverBack },
      { front: { kind: "empty" }, back: { kind: "empty" } },
    ]);
  }

  const leaves: Leaf[] = [
    { front: { kind: "cover" }, back: coverBack },
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
  return withBackCover(leaves);
}

function lastPlace(
  leaves: Leaf[],
  spread: boolean,
  noteCount: number,
  hasDedication: boolean,
) {
  if (!spread) return Math.max(1, (hasDedication ? 1 : 0) + noteCount);
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
  return { kind: "dedication" };
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
  if (face.kind === "cover" || face.kind === "back") return "cover";
  return "liner";
}

export default function CardBook({
  masterToken,
  canManage,
  recipientName,
  dedication,
  notes,
  stock,
  design = "plain",
}: {
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  intro: string | null;
  dedication: string | null;
  notes: Note[];
  stock: string;
  design?: string;
}) {
  const dedicationText = resolveDedication(dedication);
  const hasDedication = Boolean(dedicationText);
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

  const leaves = useMemo(
    () => buildLeaves(notes, spread, hasDedication),
    [notes, spread, hasDedication],
  );
  const last = lastPlace(leaves, spread, notes.length, hasDedication);

  // The viewed face survives a resize that swaps the leaf model; the
  // settled place is derived from it.
  const [view, setView] = useState<View>({ kind: "cover" });
  const [touched, setTouched] = useState(false);
  const place = placeForView(leaves, spread, view, last);
  const closed = place === 0;

  const { frameRef, sliderRef, goTo, jump, target, frameHandlers, sliderHandlers } =
    useCardTurn({
      last,
      reducedMotion,
      onRest: (t) => {
        setTouched(true);
        if (Number.isInteger(t)) setView(visibleView(leaves, spread, t));
      },
    });

  const placeRef = useRef(place);
  useLayoutEffect(() => {
    placeRef.current = place;
  });
  useLayoutEffect(() => {
    jump(placeRef.current);
  }, [leaves, jump]);

  const go = useCallback(
    (next: number) => {
      setTouched(true);
      goTo(next > last ? 0 : Math.max(0, next));
    },
    [goTo, last, setTouched],
  );

  const goForward = useCallback(() => {
    const at = target();
    go(at >= last ? 0 : at + 1);
  }, [go, last, target]);

  const goBack = useCallback(() => {
    const at = target();
    go(at <= 1 ? 0 : at - 1);
  }, [go, target]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const element = event.target as HTMLElement | null;
      if (element && /^(input|textarea|select)$/i.test(element.tagName)) return;
      if (element?.closest("dialog")) return;
      if (event.key === "ArrowRight") goForward();
      else if (event.key === "ArrowLeft") goBack();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goForward, goBack]);

  function onScrubKey(event: React.KeyboardEvent<HTMLInputElement>) {
    const moves: Record<string, () => void> = {
      ArrowRight: () => go(Math.min(last, target() + 1)),
      ArrowUp: () => go(Math.min(last, target() + 1)),
      ArrowLeft: () => go(target() - 1),
      ArrowDown: () => go(target() - 1),
      Home: () => go(0),
      End: () => go(last),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    event.stopPropagation();
    move();
  }

  const leftFace = spread && place > 0 ? leaves[place - 1]?.back : undefined;
  const rightFace = closed ? leaves[0]?.front : leaves[place]?.front;
  const announcement = closed
    ? `Birthday card for ${recipientName}, closed`
    : [describeFace(leftFace), describeFace(rightFace)]
        .filter(Boolean)
        .filter((item, index, all) => all.indexOf(item) === index)
        .join(". ") || `Inside ${recipientName}'s card`;

  function activatePage(direction: 1 | -1) {
    if (direction === 1) goForward();
    else goBack();
  }

  const noteCountLabel =
    notes.length === 0
      ? "Nothing inside yet"
      : notes.length === 1
        ? "One note"
        : `${notes.length} notes`;

  const pageLabel = closed ? "Cover" : `Page ${place} of ${last}`;

  return (
    <div className="card-book">
      <div className="sr-only" aria-hidden>
        {notes.map((note) =>
          note.image ? <img key={note.id} src={note.image} alt="" /> : null,
        )}
      </div>
      <CardObject
        stock={stock}
        spread={spread}
        frameRef={frameRef}
        handlers={frameHandlers}
      >
        {leaves.map((leaf, index) => {
          const facingFront = closed ? index === 0 : index === place;
          const facingBack = Boolean(spread && place > 0 && index === place - 1);

          return (
            <CardSheet key={index} cover={index === 0}>
              <LeafFace
                face={leaf.front}
                side="right"
                facing={facingFront}
                masterToken={masterToken}
                canManage={canManage}
                recipientName={recipientName}
                dedication={dedicationText}
                design={design}
                onOpen={index === 0 ? () => go(1) : undefined}
                onPageTurn={index === 0 ? undefined : () => activatePage(1)}
              />
              <LeafFace
                face={leaf.back}
                side="left"
                facing={facingBack}
                masterToken={masterToken}
                canManage={canManage}
                recipientName={recipientName}
                dedication={dedicationText}
                design={design}
                onPageTurn={() => activatePage(-1)}
              />
            </CardSheet>
          );
        })}
      </CardObject>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="card-scrub">
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={last}
          step="any"
          defaultValue={0}
          className="card-scrub-range"
          aria-label={`Turn the pages of ${recipientName}'s card`}
          aria-valuetext={pageLabel}
          onInputCapture={() => setTouched(true)}
          onKeyDown={onScrubKey}
          {...sliderHandlers}
        />
        <p className="card-scrub-caption" aria-hidden>
          {closed && !touched ? "Drag the cover open, or tap it" : pageLabel}
        </p>
      </div>

      {canManage ? (
        <p className="card-nav-meta">
          {notes.length === 0
            ? `Nobody has signed ${recipientName}’s card yet. Share the signing link and every note will land in here.`
            : noteCountLabel}
        </p>
      ) : null}
    </div>
  );
}

function LeafFace({
  design,
  face,
  side,
  facing,
  masterToken,
  canManage,
  recipientName,
  dedication,
  onOpen,
  onPageTurn,
}: {
  design: string;
  face: Face;
  side: "left" | "right";
  facing: boolean;
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  dedication: string;
  onOpen?: () => void;
  onPageTurn?: () => void;
}) {
  const photo = face.kind === "note" ? face.note.image : null;
  const faceStyle = photo
    ? { ["--note-photo" as string]: `url(${JSON.stringify(photo)})` }
    : undefined;
  const contents = (
    <>
      <FaceChrome side={side} />
      <FaceContents
        design={design}
        face={face}
        side={side}
        masterToken={masterToken}
        canManage={canManage}
        recipientName={recipientName}
        dedication={dedication}
      />
    </>
  );

  function handlePageClick(event: React.MouseEvent<HTMLElement>) {
    if (!onPageTurn || !facing) return;
    if (isChromeTarget(event.target) || hasTextSelection()) return;
    onPageTurn();
  }

  function handleCoverKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!facing || !onOpen) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  }

  if (face.kind === "cover") {
    return (
      <button
        type="button"
        onClick={facing ? onOpen : undefined}
        onKeyDown={handleCoverKey}
        className="card-face"
        data-face="front"
        data-stock="cover"
        aria-label={`Open ${recipientName}'s birthday card`}
        aria-hidden={!facing}
        tabIndex={facing ? 0 : -1}
        inert={!facing || undefined}
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
      data-photo={photo ? "true" : undefined}
      style={faceStyle}
      aria-hidden={!facing}
      tabIndex={-1}
      inert={!facing || undefined}
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
  dedication,
}: {
  design: string;
  face: Face;
  side: "left" | "right";
  masterToken: string;
  canManage: boolean;
  recipientName: string;
  dedication: string;
}) {
  switch (face.kind) {
    case "cover":
      return <CoverFace recipientName={recipientName} design={design} />;
    case "dedication":
      return (
        <div className="card-body card-dedication">
          {dedication ? <p>{dedication}</p> : null}
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
    case "back":
      return <div className="card-body" />;
  }
}

function CoverFace({ recipientName, design }: { recipientName: string; design: string }) {
  return <CoverSurface design={design} recipientName={recipientName} />;
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
          <MessageReader
            body={note.body}
            authorName={note.authorName}
            pen={note.pen}
            image={note.image}
          />
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
          className="quiet-link font-medium text-ink"
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
          className="quiet-link"
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
      className="quiet-link text-[0.75rem] text-muted"
    >
      Remove this note
    </button>
  );
}
