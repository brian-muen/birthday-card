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

export function penBodyClass(value: unknown): string {
  switch (parsePen(value)) {
    case "fountain":
      return "text-[1.5rem] leading-[1.7]";
    case "marker":
      return "text-[1.35rem] leading-[1.5]";
    case "brush":
      return "text-[1.45rem] leading-[1.65]";
    case "ballpoint":
      return "text-[1.125rem] leading-[1.6]";
    default:
      return "text-[1.25rem] leading-[1.6]";
  }
}

export function penNoteClass(value: unknown): string {
  switch (parsePen(value)) {
    case "fountain":
      return "text-[1.5rem] leading-[1.7] sm:text-[1.625rem]";
    case "marker":
      return "text-[1.25rem] leading-[1.5] sm:text-[1.375rem]";
    case "brush":
      return "text-[1.375rem] leading-[1.62] sm:text-[1.5rem]";
    case "ballpoint":
      return "text-[1.0625rem] leading-[1.6] sm:text-[1.125rem]";
    default:
      return "text-[1.1875rem] leading-[1.62] sm:text-[1.25rem]";
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
