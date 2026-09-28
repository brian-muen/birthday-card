import type { PenId } from "@/lib/pen";

function PenGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 28 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="signing-pen-glyph"
    >
      {children}
    </svg>
  );
}

export function PenIcon({ id }: { id: PenId }) {
  switch (id) {
    case "fountain":
      return (
        <PenGlyph>
          <path d="M10.2 5.4V3.8c0-.7.6-1.3 1.3-1.3h5c.7 0 1.3.6 1.3 1.3v1.6" />
          <rect x="9" y="5.4" width="10" height="30" fill="currentColor" fillOpacity="0.12" />
          <path d="M9 5.4h10v30H9z" />
          <path d="M10.2 35.4h7.6v6.4h-7.6z" />
          <path d="M10.2 41.8 14 69.2 17.8 41.8" />
          <path d="M14 45.4v19.6" />
          <path d="M19 8.8h2.8v14" />
        </PenGlyph>
      );
    case "marker":
      return (
        <PenGlyph>
          <rect x="8.2" y="4.2" width="11.6" height="38" fill="currentColor" fillOpacity="0.12" />
          <path d="M8.2 4.2h11.6v38H8.2z" />
          <path d="M8.2 14.6h11.6" />
          <path d="M8.2 42.2 11.2 69h5.6l3-26.8" />
        </PenGlyph>
      );
    case "pencil":
      return (
        <PenGlyph>
          <path
            d="M9 4.4h10v39.2L14 69.2 9 43.6V4.4Z"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M9 4.4h10v39.2L14 69.2 9 43.6V4.4Z" />
          <path d="M9 8.8h10" />
          <path d="M9 41.8h10" />
          <path d="M14 41.8v22.6" />
        </PenGlyph>
      );
    case "ballpoint":
      return (
        <PenGlyph>
          <path d="M11.2 2.8h5.6v5.2h-5.6z" />
          <rect x="10.2" y="8" width="7.6" height="36.4" fill="currentColor" fillOpacity="0.12" />
          <path d="M10.2 8h7.6v36.4h-7.6z" />
          <path d="M10.2 44.4 14 69.2 17.8 44.4" />
          <path d="M17.8 11.2h2.8v16" />
        </PenGlyph>
      );
    case "brush":
      return (
        <PenGlyph>
          <rect x="11" y="3.2" width="6" height="32" fill="currentColor" fillOpacity="0.12" />
          <path d="M11 3.2h6v32h-6z" />
          <path d="M8.6 35.2h10.8s1.4 3.8 1.4 7.4c0 4.2-2.8 7.8-5.6 7.8s-5.6-3.6-5.6-7.8c0-3.6 1.4-7.4 1.4-7.4Z" />
          <path d="M9 50.4c.6 5.8 2.2 12.6 5 18.8 2.8-6.2 4.4-13 5-18.8" />
        </PenGlyph>
      );
  }
}
