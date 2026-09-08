"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { penNoteClass, penSignatureClass, type PenId } from "@/lib/pen";
import { paginateNote } from "@/lib/paginate-note";

/** Page at the actual font and available space; never shrink the handwriting. */
export default function MessageReader({ body, authorName, pen }: {
  body: string;
  authorName: string;
  pen: PenId;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLParagraphElement>(null);
  const [layout, setLayout] = useState({ body, pen, pages: [body] });
  const [position, setPosition] = useState({ body, pen, index: 0 });
  const pages = layout.body === body && layout.pen === pen ? layout.pages : [body];
  const index = position.body === body && position.pen === pen
    ? Math.min(position.index, pages.length - 1) : 0;
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
      setLayout((previous) => previous.body === body && previous.pen === pen &&
        JSON.stringify(previous.pages) === JSON.stringify(next)
        ? previous : { body, pen, pages: next });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    measure();
    return () => {
      cancelled = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [body, pen, authorName]);

  return (
    <div className="note-reader">
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
              onClick={() => setPosition({ body, pen, index: index - 1 })}>Back</button>
            <span role="status" aria-live="polite">Note page {index + 1} of {pages.length}</span>
            <button type="button" className="ui-button" disabled={index === pages.length - 1}
              aria-label={`Next page of ${authorName}'s note`}
              onClick={() => setPosition({ body, pen, index: index + 1 })}>Next</button>
          </>
        ) : null}
      </div>
    </div>
  );
}
