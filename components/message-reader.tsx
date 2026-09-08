"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { penNoteClass, penSignatureClass, type PenId } from "@/lib/pen";
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
  const [layout, setLayout] = useState({ body, pen, image, pages: [body] });
  const [position, setPosition] = useState({ body, pen, image, index: 0 });
  const pages =
    layout.body === body && layout.pen === pen && layout.image === image
      ? layout.pages
      : [body];
  const index =
    position.body === body && position.pen === pen && position.image === image
      ? Math.min(position.index, pages.length - 1)
      : 0;
  const noteClass = `note-copy whitespace-pre-wrap font-card ${penNoteClass(pen)}`;

  useLayoutEffect(() => {
    const area = areaRef.current;
    const probe = probeRef.current;
    if (!area || !probe) return;
    let cancelled = false;
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
      const probe = new Image();
      probe.onload = () => {
        if (cancelled) return;
        const slotW = slot.width;
        const slotH = slot.height;
        const aspect = probe.naturalWidth / probe.naturalHeight || 1;
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
      probe.src = image;
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

  return (
    <div className="note-reader" data-photo={image ? "true" : undefined}>
      {image ? (
        <div
          ref={photoRef}
          role="img"
          aria-label={`Photo from ${authorName}`}
          className="note-photo"
          data-hidden={index === 0 ? undefined : "true"}
          style={{ visibility: index === 0 ? "visible" : "hidden" }}
        />
      ) : null}
      <div ref={areaRef} className="note-page">
        <p className={noteClass}>{pages[index]}</p>
        <p ref={probeRef} aria-hidden="true" className={`note-probe ${noteClass}`} />
      </div>
      <div className="note-signature" style={{ visibility: index === pages.length - 1 ? "visible" : "hidden" }}>
        <p className={`text-right font-card ${penSignatureClass(pen)}`}>{authorName}</p>
      </div>
      <div className="note-pagination">
        {pages.length > 1 ? (
          <>
            <button type="button" className="ui-button" disabled={index === 0}
              aria-label={`Previous page of ${authorName}'s note`}
              onClick={() => setPosition({ body, pen, image, index: index - 1 })}>Back</button>
            <span role="status" aria-live="polite">Note page {index + 1} of {pages.length}</span>
            <button type="button" className="ui-button" disabled={index === pages.length - 1}
              aria-label={`Next page of ${authorName}'s note`}
              onClick={() => setPosition({ body, pen, image, index: index + 1 })}>Next</button>
          </>
        ) : null}
      </div>
    </div>
  );
}
