"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  penBodyVar,
  penNoteClass,
  penSignatureClass,
  penVar,
  type PenId,
} from "@/lib/pen";
import { paginateNote } from "@/lib/paginate-note";

/** Page at the actual font and available space; never shrink the handwriting. */
export default function MessageReader({
  body,
  authorName,
  pen,
  image,
}: {
  body: string;
  authorName: string;
  pen: PenId;
  image?: string | null;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLParagraphElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = useId();
  const [layout, setLayout] = useState({ body, pen, image, pages: [body] });
  const [onCardFace, setOnCardFace] = useState(false);
  const [open, setOpen] = useState(false);
  const pages =
    layout.body === body && layout.pen === pen && layout.image === image
      ? layout.pages
      : [body];
  const opening = pages[0] ?? body;
  const noteClass = `note-copy whitespace-pre-wrap font-card ${penNoteClass(pen)}`;
  const bodyFace = { ["--card-face" as string]: penBodyVar(pen) };
  const signFace = { ["--card-face" as string]: penVar(pen) };
  const remainder = pages.slice(1).join("");
  const hasMore = pages.length > 1;

  useLayoutEffect(() => {
    const area = areaRef.current;
    const probe = probeRef.current;
    if (!area || !probe) return;
    let cancelled = false;
    setOnCardFace(Boolean(area.closest(".card-face")));
    function measure() {
      if (cancelled || !area || !probe || !area.clientHeight) return;
      probe.style.width = `${area.clientWidth}px`;
      const next = paginateNote(body, (text) => {
        probe.textContent = text;
        return probe.getBoundingClientRect().height <= area.clientHeight - 4;
      });
      setLayout((previous) =>
        previous.body === body &&
        previous.pen === pen &&
        previous.image === image &&
        JSON.stringify(previous.pages) === JSON.stringify(next)
          ? previous
          : { body, pen, image, pages: next },
      );
    }
    function syncPhotoSlot() {
      const spacer = photoRef.current;
      const face = spacer?.closest(".card-face");
      if (!spacer || !(face instanceof HTMLElement) || !image) return;
      if (face.closest(".card-leaf[data-moving='true']")) return;
      const faceBox = face.getBoundingClientRect();
      const slot = spacer.getBoundingClientRect();
      if (!faceBox.width || !slot.width) return;
      const probeImage = new Image();
      probeImage.onload = () => {
        if (cancelled) return;
        const slotW = slot.width;
        const slotH = slot.height;
        const aspect = probeImage.naturalWidth / probeImage.naturalHeight || 1;
        let width = slotW;
        let height = slotW / aspect;
        if (height > slotH) {
          height = slotH;
          width = slotH * aspect;
        }
        const x = slot.left - faceBox.left + (slotW - width) / 2;
        const y = slot.top - faceBox.top;
        face.style.setProperty("--note-photo-x", `${x}px`);
        face.style.setProperty("--note-photo-y", `${y}px`);
        face.style.setProperty("--note-photo-w", `${width}px`);
        face.style.setProperty("--note-photo-h", `${height}px`);
      };
      probeImage.src = image;
    }
    const observer = new ResizeObserver(() => {
      measure();
      syncPhotoSlot();
    });
    observer.observe(area);
    void document.fonts.ready.then(() => {
      measure();
      syncPhotoSlot();
    });
    document.fonts.addEventListener("loadingdone", measure);
    measure();
    syncPhotoSlot();
    return () => {
      cancelled = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [body, pen, authorName, image]);

  function openRemainder() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeRemainder() {
    dialogRef.current?.close();
  }

  return (
    <div className="note-reader" data-photo={image ? "true" : undefined}>
      {image ? (
        <div
          ref={photoRef}
          role="img"
          aria-label={`Photo from ${authorName}`}
          className="note-photo"
        >
          {onCardFace ? null : (
            <img
              src={image}
              alt=""
              className="h-full w-full object-contain object-top"
            />
          )}
        </div>
      ) : null}
      <div ref={areaRef} className="note-page">
        <p className={noteClass} style={bodyFace}>
          {opening}
        </p>
        <p
          ref={probeRef}
          aria-hidden="true"
          className={`note-probe ${noteClass}`}
          style={bodyFace}
        />
      </div>
      <div
        className="note-signature"
        style={{ visibility: hasMore ? "hidden" : "visible" }}
      >
        <p
          className={`text-right font-card ${penSignatureClass(pen)}`}
          style={signFace}
        >
          {authorName}
        </p>
      </div>
      <div className="note-pagination">
        {hasMore ? (
          <>
            <button
              ref={continueRef}
              type="button"
              className="ui-button"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={`Continue ${authorName}'s note`}
              onClick={openRemainder}
            >
              Continue
            </button>
            <span role="status" aria-live="polite">
              Note continues
            </span>
            <span />
          </>
        ) : null}
      </div>
      {hasMore ? (
        <dialog
          ref={dialogRef}
          className="note-continue-dialog max-h-[min(80svh,42rem)] w-[min(calc(100%-2rem),28rem)] border-0 bg-[var(--paper-liner,#fffdf8)] p-6 text-[color:var(--ink-pen,#2a231c)]"
          aria-labelledby={dialogTitleId}
          onClose={() => {
            setOpen(false);
            continueRef.current?.focus();
          }}
        >
          <h2 id={dialogTitleId} className="sr-only">
            The rest of {authorName}&apos;s note
          </h2>
          <p className={noteClass} style={bodyFace}>
            {remainder}
          </p>
          <div className="note-signature">
            <p
              className={`text-right font-card ${penSignatureClass(pen)}`}
              style={signFace}
            >
              {authorName}
            </p>
          </div>
          <button
            type="button"
            className="ui-button note-continue-close"
            onClick={closeRemainder}
          >
            Close
          </button>
        </dialog>
      ) : null}
    </div>
  );
}
