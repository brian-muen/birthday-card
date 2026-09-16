export type InkPath = {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fillRule?: "evenodd" | "nonzero";
};

export type PaperPiece = {
  id: string;
  /** Tight box around the drawing. SVG pieces get a die-cut cream edge. */
  viewBox: [number, number, number, number];
  paths: InkPath[];
  /** Watercolor sticker in /public. The cream die-cut is in the PNG. */
  src?: string;
};

export type PiecePlace = {
  piece: string;
  /** Top-left, as % of the cream stage (100×180). */
  x: number;
  y: number;
  w: number;
  rotate?: number;
  /** 1 sits in the window; 2–3 are stuck on the front sheet and may overlap the hole. */
  depth: 1 | 2 | 3;
  onFrame?: boolean;
  /** Printed on the well, no die-cut edge. */
  kind?: "sticker" | "print";
};

/** Paper seen through the window when there is no painting. */
export type WellPaper = "staff" | "seigaiha" | "washi" | "dots";

export type BoxPainting = {
  src: string;
  /** CSS object-position for the crop inside the window. */
  position?: string;
  /** Extra cover-zoom so a detail can sit in the hole. */
  zoom?: number;
};

export type BoxRecipe = {
  id: string;
  well: string;
  /** Thin 貼り箱 body, a few millimetres of wrap at the lid's left edge. */
  wrap: string;
  paper?: WellPaper;
  /** Existing public-domain painting shown as the 中紙. */
  painting?: BoxPainting;
  hole: string;
  /** Printed on the well, seen through the window. */
  print: InkPath[];
  /** Printed on the cream face (clipped to the board, not the hole). */
  facePrint?: InkPath[];
  places: PiecePlace[];
};

/** Cream lid coordinate space — the 5×7 face, not a side wall. */
export const STAGE = { w: 100, h: 180 } as const;
