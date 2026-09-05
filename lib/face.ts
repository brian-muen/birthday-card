export const FACES = [
  { id: "hand", label: "Hand", sample: "Aa", varName: "--font-caveat" },
  { id: "script", label: "Script", sample: "Aa", varName: "--font-great-vibes" },
  { id: "serif", label: "Serif", sample: "Aa", varName: "--font-cormorant" },
  { id: "print", label: "Print", sample: "Aa", varName: "--font-source-sans" },
  { id: "marker", label: "Marker", sample: "Aa", varName: "--font-caveat-brush" },
] as const;

export type FaceId = (typeof FACES)[number]["id"];

export const DEFAULT_FACE: FaceId = "hand";

export function parseFace(value: unknown): FaceId {
  const id = String(value ?? "");
  return FACES.some((face) => face.id === id) ? (id as FaceId) : DEFAULT_FACE;
}

export function faceVar(value: unknown): string {
  const id = parseFace(value);
  const face = FACES.find((item) => item.id === id) ?? FACES[0];
  return `var(${face.varName})`;
}

export function faceClass(value: unknown): string {
  switch (parseFace(value)) {
    case "script":
      return "font-face-script";
    case "serif":
      return "font-face-serif";
    case "print":
      return "font-face-print";
    case "marker":
      return "font-face-marker";
    default:
      return "font-face-hand";
  }
}

/** Formal faces keep a straight signature; the others still look written. */
export function faceIsLively(value: unknown): boolean {
  const id = parseFace(value);
  return id === "hand" || id === "script" || id === "marker";
}

export function faceGreetingItalic(value: unknown): boolean {
  const id = parseFace(value);
  return id === "serif" || id === "print";
}
