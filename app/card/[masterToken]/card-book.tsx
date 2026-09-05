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

type Note = {
  id: number;
  authorName: string;
  body: string;
  date: string;
};

/**
 * Below this the card reads as a single panel — the right-hand page, with the
 * fold at its left edge. Above it, the card opens into a two-page spread.
 * Kept in step with the aspect-ratio rules in globals.css.
 */
const SPREAD_QUERY = "(min-width: 52rem)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Browser-only values, read the way the rest of this app reads them.
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

// Real signatures never line up. Derive a stable tilt from the name so each
// one sits at its own angle without changing on every render.
function tiltFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  }
  return ((hash % 9) - 4) / 2;
}

// A cover is set to fit the name, the way a printer would set it.
function coverTypeSize(name: string) {
  if (name.length > 24) return "text-[1.625rem] sm:text-[1.875rem]";
  if (name.length > 13) return "text-[2rem] sm:text-[2.375rem]";
  return "text-[2.375rem] sm:text-[2.875rem]";
}

type Page =
  | { kind: "cover" }
  | { kind: "inside-front" }
  | { kind: "message"; note: Note; number: number }
  | { kind: "closing" }
  | { kind: "blank" };

/**
 * The card as an ordered run of pages: front cover, the panel inside the fold,
 * one page per message, then a closing panel.
 *
 * A spread pairs pages into two-sided leaves (leaf i shows page 2i, and page
 * 2i+1 on its back), so the run is padded to an odd length — that keeps the
 * closing panel on the right of the final spread instead of stranding it
 * opposite nothing. A phone shows one page per leaf and needs no padding.
 */
function buildPages(notes: Note[], spread: boolean): Page[] {
  const pages: Page[] = [{ kind: "cover" }, { kind: "inside-front" }];

  notes.forEach((note, index) => {
    pages.push({ kind: "message", note, number: index + 1 });
  });

  if (notes.length > 0) {
    if (spread && pages.length % 2 !== 0) pages.push({ kind: "blank" });
    pages.push({ kind: "closing" });
  }
  if (spread && pages.length % 2 === 0) pages.push({ kind: "blank" });

  return pages;
}

function normalizeLead(lead: number, lastPage: number, spread: boolean) {
  const clamped = Math.max(0, Math.min(lead, lastPage));
  return spread ? clamped - (clamped % 2) : clamped;
}

function describePage(page: Page | undefined, total: number) {
  if (!page) return null;
  switch (page.kind) {
    case "cover":
      return "Front cover";
    case "inside-front":
      return "Inside the front cover";
    case "message":
      return `Message ${page.number} of ${total}, from ${page.note.authorName}`;
    case "closing":
      return "The last page";
    case "blank":
      return "Blank page";
  }
}

export default function CardBook({
  masterToken,
  recipientName,
  intro,
  notes,
}: {
  masterToken: string;
  recipientName: string;
  intro: string | null;
  notes: Note[];
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

  // `lead` is the page showing on the right — the only piece of position state.
  // `moving` is the leaf mid-turn, which needs to sit above the whole stack
  // until it lands.
  // `touched` keeps the object still on the way in: the spread resolves once on
  // load without sliding into place, and only answers motion after that.
  const [{ lead: rawLead, moving, touched }, setPlace] = useState<{
    lead: number;
    moving: number | null;
    touched: boolean;
  }>({ lead: 0, moving: null, touched: false });

  const pages = useMemo(() => buildPages(notes, spread), [notes, spread]);

  const pagesPerLeaf = spread ? 2 : 1;
  const lastPage = pages.length - 1;
  // Clamp in case a deletion took pages out from under us, and keep the lead
  // page on a leaf boundary when the layout switches to a spread.
  const lead = normalizeLead(rawLead, lastPage, spread);
  const closed = lead === 0;

  const leafCount = Math.ceil(pages.length / pagesPerLeaf);
  const leavesTurned = lead / pagesPerLeaf;

  const turn = useCallback(
    (delta: 1 | -1) => {
      setPlace((previous) => {
        const from = normalizeLead(previous.lead, lastPage, spread);
        const next = from + delta * pagesPerLeaf;
        if (next < 0 || next > lastPage) return previous;
        return {
          lead: next,
          // Turning forward moves the leaf we were resting on; turning back
          // moves the one we are returning to.
          moving: reducedMotion
            ? null
            : (delta === 1 ? from : next) / pagesPerLeaf,
          touched: true,
        };
      });
    },
    [lastPage, pagesPerLeaf, reducedMotion, spread],
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

  const rightPage = lead;
  // -2 can never match a real back-face index, so on a phone (where leaves have
  // no visible back) nothing is treated as the left-hand page.
  const leftPage = spread ? lead - 1 : -2;

  const announcement = spread
    ? [describePage(pages[leftPage], notes.length), describePage(pages[rightPage], notes.length)]
        .filter(Boolean)
        .join(". ")
    : describePage(pages[rightPage], notes.length);

  // The paper still to come stacks on the fore-edge; what you have read
  // stacks against the fold.
  const foreEdge = Math.min(7, (leafCount - leavesTurned) * 1.4);
  const spineEdge = Math.min(7, leavesTurned * 1.4);

  return (
    <div>
      <div className="card-frame" data-spread={spread} data-animate={touched}>
        <div className="card-stage" data-closed={closed}>
          {/* The card's body, under the leaves. */}
          <div aria-hidden className="card-panel paper-lift" data-half="right">
            <span className="card-gutter" data-side="recto" />
            <span
              className="card-edges"
              data-side="fore"
              style={{ width: `${foreEdge}px` }}
            />
          </div>

          {spread ? (
            <div aria-hidden className="card-panel paper-lift" data-half="left">
              <span className="card-gutter" data-side="verso" />
              <span
                className="card-edges"
                data-side="spine"
                style={{ width: `${spineEdge}px` }}
              />
            </div>
          ) : null}

          {Array.from({ length: leafCount }, (_, leaf) => {
            const frontIndex = leaf * pagesPerLeaf;
            const backIndex = spread ? frontIndex + 1 : -1;
            const turned = leaf < leavesTurned;

            return (
              <div
                key={leaf}
                className="card-leaf"
                data-cover={leaf === 0}
                data-turned={turned}
                data-moving={moving === leaf}
                onTransitionEnd={settle}
                style={{
                  zIndex:
                    moving === leaf
                      ? leafCount + 20
                      : turned
                        ? leaf + 1
                        : leafCount - leaf,
                }}
              >
                <PageFace
                  page={pages[frontIndex]}
                  side="recto"
                  visible={frontIndex === rightPage}
                  face="front"
                  masterToken={masterToken}
                  recipientName={recipientName}
                  intro={intro}
                  notes={notes}
                  onOpen={() => turn(1)}
                />
                <PageFace
                  page={pages[backIndex]}
                  side="verso"
                  visible={backIndex === leftPage}
                  face="back"
                  masterToken={masterToken}
                  recipientName={recipientName}
                  intro={intro}
                  notes={notes}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Reserved height so opening the card doesn't shunt the page around. */}
      <nav aria-label="Card pages" className="mt-9 min-h-11">
        {closed ? null : (
          <div className="flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => turn(-1)}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
            >
              {lead - pagesPerLeaf === 0 ? "Close the card" : "Turn back"}
            </button>

            <button
              type="button"
              onClick={() => turn(1)}
              disabled={lead >= lastPage}
              className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass disabled:pointer-events-none disabled:opacity-0"
            >
              Turn the page
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

function PageFace({
  page,
  side,
  face,
  visible,
  masterToken,
  recipientName,
  intro,
  notes,
  onOpen,
}: {
  page: Page | undefined;
  side: "recto" | "verso";
  face: "front" | "back";
  visible: boolean;
  masterToken: string;
  recipientName: string;
  intro: string | null;
  notes: Note[];
  onOpen?: () => void;
}) {
  // Pages that aren't in view stay in the DOM — they're the far side of a leaf
  // — so they have to be kept away from the reader and out of the tab order.
  const hidden = !visible;
  const shell = (
    <>
      <span className="card-gutter" data-side={side} aria-hidden />
      {page ? (
        <PageContents
          page={page}
          side={side}
          masterToken={masterToken}
          recipientName={recipientName}
          intro={intro}
          notes={notes}
        />
      ) : null}
    </>
  );

  // The closed cover is the one affordance for opening the card, so the whole
  // panel is the target.
  if (page?.kind === "cover") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="card-face group cursor-pointer"
        data-face={face}
        data-stock="cover"
        aria-hidden={hidden}
        inert={hidden}
      >
        {shell}
      </button>
    );
  }

  return (
    <div
      className="card-face"
      data-face={face}
      // The panel inside the fold is the back of the cover, not a leaf, so it
      // takes the cover's tone.
      data-stock={page?.kind === "inside-front" ? "liner" : undefined}
      aria-hidden={hidden}
      inert={hidden}
    >
      {shell}
    </div>
  );
}

function PageContents({
  page,
  side,
  masterToken,
  recipientName,
  intro,
  notes,
}: {
  page: Page;
  side: "recto" | "verso";
  masterToken: string;
  recipientName: string;
  intro: string | null;
  notes: Note[];
}) {
  // Books give the gutter side a wider margin than the outer edge. Pages set
  // centred — the cover and the closing panel — get even margins instead.
  const centred = page.kind === "cover" || page.kind === "closing";
  // Type centred between equal margins reads as sitting too low, so print gives
  // the foot a deeper margin than the head and lets the focal line ride up to
  // the optical centre, about a third of the way down.
  const vertical = centred ? "pt-8 pb-14 sm:pt-9 sm:pb-16" : "py-8 sm:py-10";
  const horizontal = centred
    ? "px-7 sm:px-9"
    : side === "recto"
      ? "pl-9 pr-6 sm:pl-11 sm:pr-8"
      : "pl-6 pr-9 sm:pl-8 sm:pr-11";
  const body = `card-body ${vertical} ${horizontal}`;

  switch (page.kind) {
    case "cover":
      return (
        <span className={`${body} items-center text-center`}>
          {/* One focal line, generous air, a single rule for ornament. */}
          <span className="my-auto flex flex-col items-center">
            <span className="font-serif text-[1.0625rem] italic text-muted">
              Happy birthday,
            </span>
            {/* A name is never hyphenated; it breaks at a hyphen it already
                has, or not at all. */}
            <span
              className={`mt-2 font-serif leading-[1.02] tracking-[-0.02em] break-words ${coverTypeSize(recipientName)}`}
            >
              {recipientName}
            </span>
            <span className="mt-7 h-px w-10 bg-brass/70" />
          </span>

          {/* Three type sizes on a cover is enough, so the two lines at the
              foot share one and differ by weight instead. */}
          <span className="flex flex-col items-center text-[0.8125rem]">
            <span className="text-muted">
              {notes.length === 0
                ? "Nothing inside yet"
                : notes.length === 1
                  ? "One message inside"
                  : `${notes.length} messages inside`}
            </span>
            <span className="mt-2.5 font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors group-hover:decoration-brass">
              Open the card
            </span>
          </span>
        </span>
      );

    case "inside-front":
      return (
        <div className={body}>
          {intro ? (
            <p className="font-serif text-[1.0625rem] leading-[1.62] whitespace-pre-wrap">
              {intro}
            </p>
          ) : null}

          {notes.length === 0 ? (
            <p className="my-auto leading-relaxed text-muted">
              Nobody has signed this yet. Share the signing link and every
              message becomes a page in here.
            </p>
          ) : (
            <div className={intro ? "mt-9" : "my-auto"}>
              <p className="text-[0.8125rem] text-muted">Signed by</p>
              <ul className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-3">
                {Array.from(new Set(notes.map((note) => note.authorName))).map(
                  (name) => (
                    <li
                      key={name}
                      className="font-hand text-[1.5rem] leading-none text-ink/85"
                      style={{ transform: `rotate(${tiltFor(name)}deg)` }}
                    >
                      {name}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      );

    case "message":
      return (
        <div className={body}>
          <p
            className={`text-[0.75rem] tabular-nums text-brass ${side === "recto" ? "text-right" : ""}`}
          >
            {page.number} of {notes.length}
          </p>

          {/* Focusable so a long message can be read from the keyboard; the
              arrow keys stay bound to turning pages. */}
          <div className="card-scroll mt-6 flex flex-col" tabIndex={0}>
            <p className="my-auto font-serif text-[1.125rem] leading-[1.62] whitespace-pre-wrap break-words">
              {page.note.body}
            </p>
          </div>

          <div className="mt-7 text-right">
            <p
              className="font-hand text-[1.75rem] leading-none"
              style={{ transform: `rotate(${tiltFor(page.note.authorName)}deg)` }}
            >
              {page.note.authorName}
            </p>
            <p className="mt-2 text-[0.75rem] text-muted">{page.note.date}</p>
          </div>

          <div className="mt-5 border-t border-rule pt-4">
            <RemoveControl masterToken={masterToken} messageId={page.note.id} />
          </div>
        </div>
      );

    case "closing":
      return (
        <div className={`${body} items-center justify-center text-center`}>
          <p className="font-serif text-[1.5rem] leading-tight">
            That&rsquo;s everyone.
          </p>
          <span className="mt-6 h-px w-10 bg-brass/70" />
          <p className="mt-6 max-w-[26ch] text-[0.9375rem] leading-relaxed text-muted">
            {notes.length === 1
              ? `One message, collected for ${recipientName}.`
              : `${notes.length} messages, collected for ${recipientName}.`}
          </p>
        </div>
      );

    case "blank":
      return null;
  }
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
          {error ?? (isPending ? "Removing…" : "Remove this page for good?")}
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
      Remove this page
    </button>
  );
}
