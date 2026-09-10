export const PENS = [
  {
    id: "fountain",
    label: "Fountain",
    varName: "--font-great-vibes",
    file: "great-vibes.ttf",
  },
  {
    id: "marker",
    label: "Marker",
    varName: "--font-caveat-brush",
    file: "caveat-brush.ttf",
  },
  {
    id: "pencil",
    label: "Pencil",
    varName: "--font-caveat",
    file: "caveat.ttf",
  },
  {
    id: "ballpoint",
    label: "Ballpoint",
    varName: "--font-source-sans",
    file: "source-sans.ttf",
  },
  {
    id: "brush",
    label: "Brush",
    varName: "--font-satisfy",
    file: "cormorant.ttf",
  },
] as const;

export type PenId = (typeof PENS)[number]["id"];

export const DEFAULT_PEN: PenId = "pencil";

/** Older card-level face ids, if they ever land on a note. */
const FACE_ALIASES: Record<string, PenId> = {
  hand: "pencil",
  script: "fountain",
  print: "ballpoint",
  serif: "pencil",
};

export function parsePen(value: unknown): PenId {
  const id = String(value ?? "");
  if (PENS.some((pen) => pen.id === id)) return id as PenId;
  return FACE_ALIASES[id] ?? DEFAULT_PEN;
}

export function penVar(value: unknown): string {
  const id = parsePen(value);
  const pen = PENS.find((item) => item.id === id) ?? PENS[2];
  return `var(${pen.varName})`;
}

export function penClass(value: unknown): string {
  switch (parsePen(value)) {
    case "fountain":
      return "font-face-fountain";
    case "marker":
      return "font-face-marker";
    case "ballpoint":
      return "font-face-ballpoint";
    case "brush":
      return "font-face-brush";
    default:
      return "font-face-pencil";
  }
}

export function penFile(value: unknown): string {
  const id = parsePen(value);
  return (PENS.find((pen) => pen.id === id) ?? PENS[2]).file;
}

/** Ballpoint is print; the rest still look written. */
export function penIsLively(value: unknown): boolean {
  return parsePen(value) !== "ballpoint";
}

/**
 * Paragraph metrics for the writing field. Fountain and brush keep their
 * font ids; size and line-height keep them readable as body text.
 */
export function penBodyClass(value: unknown): string {
  switch (parsePen(value)) {
    case "fountain":
      return "text-[1.25rem] leading-[1.95]";
    case "marker":
      return "text-[1.3rem] leading-[1.55]";
    case "brush":
      return "text-[1.2rem] leading-[1.85]";
    case "ballpoint":
      return "text-[1.125rem] leading-[1.65]";
    default:
      return "text-[1.25rem] leading-[1.65]";
  }
}

/**
 * Paragraph metrics for a finished note. Same font ids as the pen; script
 * pens stay at reading size so Great Vibes / Satisfy are not body display.
 */
export function penNoteClass(value: unknown): string {
  switch (parsePen(value)) {
    case "fountain":
      return "text-[1.1875rem] leading-[2] sm:text-[1.25rem]";
    case "marker":
      return "text-[1.2rem] leading-[1.55] sm:text-[1.3rem]";
    case "brush":
      return "text-[1.125rem] leading-[1.85] sm:text-[1.2rem]";
    case "ballpoint":
      return "text-[1.0625rem] leading-[1.65] sm:text-[1.125rem]";
    default:
      return "text-[1.1875rem] leading-[1.65] sm:text-[1.25rem]";
  }
}

/** Signature line: same pen, including script faces at a larger size. */
export function penSignatureClass(value: unknown): string {
  const face = penClass(value);
  switch (parsePen(value)) {
    case "fountain":
      return `${face} text-[1.85rem] leading-[1.15] sm:text-[2.05rem]`;
    case "marker":
      return `${face} text-[1.45rem] leading-[1.2]`;
    case "brush":
      return `${face} text-[1.65rem] leading-[1.2] sm:text-[1.85rem]`;
    case "ballpoint":
      return `${face} text-[1.1875rem] leading-[1.3]`;
    default:
      return `${face} text-[1.45rem] leading-[1.2]`;
  }
}

export function penPdfSize(value: unknown): number {
  switch (parsePen(value)) {
    case "fountain":
      return 16;
    case "marker":
      return 13;
    case "brush":
      return 14;
    case "ballpoint":
      return 11;
    default:
      return 12;
  }
}
