import type { BoxRecipe } from "./types";
import { STAGE } from "./types";

export const BOX_DESIGN_IDS = [
  "recital",
  "goldfish",
  "loquat",
  "cats",
  "mimosa",
  "leaves",
  "recital-cut",
  "goldfish-cut",
  "loquat-cut",
  "cats-cut",
  "mimosa-cut",
  "leaves-cut",
] as const;
export type BoxDesignId = (typeof BOX_DESIGN_IDS)[number];

export function isBoxDesign(id: string): id is BoxDesignId {
  return (BOX_DESIGN_IDS as readonly string[]).includes(id);
}

export { STAGE };

const RECITAL_HOLE =
  "M8 32C8 22 26 18 50 18C74 18 92 22 92 32L92 124C92 134 72 142 50 142C28 142 8 134 8 124Z";

const GOLDFISH_HOLE =
  "M50 20C76 20 92 48 92 80C92 118 74 146 50 146C26 146 8 118 8 80C8 48 24 20 50 20Z";

const LOQUAT_HOLE =
  "M10 24H90Q95 24 95 30V128Q95 136 90 136H10Q5 136 5 128V30Q5 24 10 24Z";

const CATS_HOLE =
  "M12 34C12 24 28 20 50 20C72 20 88 24 88 34L88 120C88 132 70 140 50 140C30 140 12 132 12 120Z";

const MIMOSA_HOLE =
  "M50 22C74 22 90 46 90 78C90 116 72 142 50 142C28 142 10 116 10 78C10 46 26 22 50 22Z";

const LEAVES_HOLE =
  "M22 26C40 16 62 18 80 28C92 36 94 54 88 72C96 88 90 112 74 126C58 140 36 140 22 128C8 116 6 92 12 74C4 56 8 36 22 26Z";

const WINDOW_RECIPES: Record<
  "recital" | "goldfish" | "loquat" | "cats" | "mimosa" | "leaves",
  BoxRecipe
> = {
  recital: {
    id: "recital",
    well: "#2a3a52",
    wrap: "#3d4f68",
    painting: { src: "/paintings/recital.jpg", position: "52% 38%" },
    hole: RECITAL_HOLE,
    print: [],
    places: [
      { piece: "treble", x: 5, y: 3, w: 11, rotate: -6, depth: 2, onFrame: true },
      { piece: "note", x: 78, y: 5, w: 8, rotate: 12, depth: 2, onFrame: true },
      { piece: "notes-beam", x: 84, y: 14, w: 12, rotate: 8, depth: 2, onFrame: true },
    ],
  },
  goldfish: {
    id: "goldfish",
    well: "#efe8dc",
    wrap: "#b8a890",
    painting: { src: "/paintings/goldfish.jpg", position: "74% 68%", zoom: 2.05 },
    hole: GOLDFISH_HOLE,
    print: [],
    places: [],
  },
  loquat: {
    id: "loquat",
    well: "#efece4",
    wrap: "#6a6a58",
    painting: { src: "/paintings/loquat.jpg", position: "42% 20%" },
    hole: LOQUAT_HOLE,
    print: [],
    places: [],
  },
  cats: {
    id: "cats",
    well: "#efe8dc",
    wrap: "#8a7a68",
    painting: { src: "/paintings/cats.jpg", position: "50% 72%", zoom: 1.28 },
    hole: CATS_HOLE,
    print: [],
    places: [],
  },
  mimosa: {
    id: "mimosa",
    well: "#2a2218",
    wrap: "#c4a24a",
    painting: { src: "/paintings/mimosa.jpg", position: "48% 28%", zoom: 1.2 },
    hole: MIMOSA_HOLE,
    print: [],
    places: [],
  },
  leaves: {
    id: "leaves",
    well: "#d8c8b0",
    wrap: "#7a3a38",
    painting: { src: "/paintings/leaves.jpg", position: "48% 36%" },
    hole: LEAVES_HOLE,
    print: [],
    places: [],
  },
};

const CUT_RECIPES: Record<
  "recital-cut" | "goldfish-cut" | "loquat-cut" | "cats-cut" | "mimosa-cut" | "leaves-cut",
  BoxRecipe
> = {
  "recital-cut": {
    id: "recital-cut",
    well: "#ebe4d4",
    wrap: "#d4c4a0",
    paper: "staff",
    hole: RECITAL_HOLE,
    print: [
      { d: "M10 46C30 38 70 38 90 46", stroke: "#d2c8b4", strokeWidth: 0.55 },
      { d: "M10 52C30 44 70 44 90 52", stroke: "#d2c8b4", strokeWidth: 0.55 },
      { d: "M10 58C30 50 70 50 90 58", stroke: "#d2c8b4", strokeWidth: 0.55 },
      { d: "M10 64C30 56 70 56 90 64", stroke: "#d2c8b4", strokeWidth: 0.55 },
      { d: "M16 38C18 36.4 20.4 38.2 18.8 40C16.4 40 17.2 36.8 16 38Z", fill: "#d8c9a6", opacity: 0.8 },
      { d: "M80 40C82 38.4 84.4 40.2 82.8 42C80.4 42 81.2 38.8 80 40Z", fill: "#d8c9a6", opacity: 0.8 },
    ],
    facePrint: [
      { d: "M8 24C28 16 72 16 92 24", stroke: "#d2c8b4", strokeWidth: 0.5 },
      { d: "M8 28C28 20 72 20 92 28", stroke: "#d2c8b4", strokeWidth: 0.5 },
      { d: "M8 32C28 24 72 24 92 32", stroke: "#d2c8b4", strokeWidth: 0.5 },
    ],
    places: [
      { piece: "clover", x: 14, y: 22, w: 7, rotate: -16, depth: 1, kind: "print" },
      { piece: "clover", x: 64, y: 24, w: 6, rotate: 12, depth: 1, kind: "print" },
      { piece: "daisy", x: 76, y: 36, w: 10, rotate: 14, depth: 1, kind: "print" },
      { piece: "clover", x: 80, y: 56, w: 7, rotate: 8, depth: 1, kind: "print" },
      { piece: "daisy", x: 10, y: 52, w: 9, rotate: -10, depth: 1, kind: "print" },
      { piece: "cat-cream-sit", x: 8, y: 26, w: 18, rotate: -4, depth: 1 },
      { piece: "cat-honey-leap", x: 30, y: 10, w: 42, rotate: 10, depth: 1 },
      { piece: "cat-grey-lie", x: 28, y: 78, w: 44, rotate: -8, depth: 1 },
      { piece: "treble", x: 4, y: 3, w: 12, rotate: -4, depth: 2, onFrame: true },
      { piece: "note", x: 16, y: 2, w: 10, rotate: -22, depth: 2, onFrame: true },
      { piece: "notes-beam", x: 28, y: 1, w: 16, rotate: 8, depth: 2, onFrame: true },
      { piece: "clover", x: 44, y: 6, w: 6, rotate: -8, depth: 2, onFrame: true, kind: "print" },
      { piece: "note", x: 50, y: 1, w: 10, rotate: 12, depth: 2, onFrame: true },
      { piece: "note", x: 62, y: 2, w: 10, rotate: 18, depth: 2, onFrame: true },
      { piece: "notes-beam", x: 74, y: 6, w: 14, rotate: 6, depth: 2, onFrame: true },
      { piece: "daisy", x: 86, y: 14, w: 10, rotate: 12, depth: 2, onFrame: true },
      { piece: "mimosa", x: -2, y: 26, w: 26, rotate: -12, depth: 2, onFrame: true },
      { piece: "daisy", x: 0, y: 48, w: 12, rotate: -8, depth: 2, onFrame: true },
      { piece: "clover", x: 0, y: 58, w: 9, rotate: 6, depth: 2, onFrame: true },
      { piece: "mimosa", x: 74, y: 30, w: 26, rotate: 14, depth: 2, onFrame: true },
      { piece: "daisy", x: 82, y: 50, w: 12, rotate: 10, depth: 2, onFrame: true },
      { piece: "clover", x: 86, y: 60, w: 8, rotate: 18, depth: 2, onFrame: true },
      { piece: "piano", x: 12, y: 42, w: 48, rotate: -2, depth: 2, onFrame: true },
      { piece: "cat-honey-play", x: 50, y: 56, w: 18, rotate: 4, depth: 3, onFrame: true },
      { piece: "score", x: 2, y: 68, w: 26, rotate: -8, depth: 3, onFrame: true },
      { piece: "cat-honey-loaf", x: 8, y: 74, w: 14, rotate: -4, depth: 3, onFrame: true },
      { piece: "cat-grey-sing", x: 72, y: 48, w: 20, rotate: 6, depth: 3, onFrame: true },
      { piece: "daisy", x: 58, y: 84, w: 9, rotate: 8, depth: 2, onFrame: true },
      { piece: "clover", x: 88, y: 76, w: 7, rotate: 14, depth: 2, onFrame: true },
      { piece: "note", x: 88, y: 66, w: 8, rotate: 20, depth: 2, onFrame: true },
    ],
  },
  "goldfish-cut": {
    id: "goldfish-cut",
    well: "#d7e6e3",
    wrap: "#7e949c",
    paper: "seigaiha",
    hole: GOLDFISH_HOLE,
    print: [
      { d: "M16 72C32 64 48 66 54 74C66 66 80 64 92 72", stroke: "#b7c9c6", strokeWidth: 0.7, opacity: 0.7 },
      { d: "M14 90C30 82 48 84 56 92C68 84 82 82 94 90", stroke: "#b7c9c6", strokeWidth: 0.7, opacity: 0.55 },
    ],
    places: [
      { piece: "weed-tall", x: 10, y: 36, w: 14, rotate: -8, depth: 1 },
      { piece: "weed-short", x: 70, y: 48, w: 16, rotate: 10, depth: 1 },
      { piece: "weed-tall", x: 80, y: 32, w: 12, rotate: 6, depth: 1 },
      { piece: "goldfish-small", x: 54, y: 18, w: 20, rotate: -16, depth: 1 },
      { piece: "goldfish-small", x: 12, y: 58, w: 24, rotate: 12, depth: 1 },
      { piece: "pebble", x: 22, y: 78, w: 9, depth: 1 },
      { piece: "pebble", x: 44, y: 84, w: 7, rotate: 18, depth: 1 },
      { piece: "goldfish", x: 8, y: 46, w: 72, rotate: 3, depth: 3, onFrame: true },
      { piece: "weed-short", x: 0, y: 56, w: 16, rotate: -12, depth: 2, onFrame: true },
      { piece: "weed-tall", x: 80, y: 52, w: 16, rotate: 8, depth: 2, onFrame: true },
      { piece: "pebble", x: 28, y: 82, w: 10, rotate: 8, depth: 2, onFrame: true },
      { piece: "pebble", x: 48, y: 86, w: 8, rotate: -10, depth: 2, onFrame: true },
      { piece: "clover", x: 82, y: 82, w: 10, rotate: 16, depth: 2, onFrame: true },
    ],
  },
  "loquat-cut": {
    id: "loquat-cut",
    well: "#e6ecd8",
    wrap: "#8f9a68",
    paper: "washi",
    hole: LOQUAT_HOLE,
    print: [
      { d: "M10 118C28 108 50 112 68 102C82 94 94 98 100 108", stroke: "#c9d0b4", strokeWidth: 0.65, opacity: 0.8 },
    ],
    places: [
      { piece: "leaf-long", x: 58, y: 8, w: 24, rotate: 22, depth: 1 },
      { piece: "clover", x: 14, y: 28, w: 7, rotate: -12, depth: 1, kind: "print" },
      { piece: "loquat-single", x: 18, y: 48, w: 16, rotate: 8, depth: 1 },
      { piece: "leaf-broad", x: 0, y: 22, w: 26, rotate: -22, depth: 2, onFrame: true },
      { piece: "leaf-long", x: 72, y: 18, w: 22, rotate: 18, depth: 2, onFrame: true },
      { piece: "loquat-cluster", x: 18, y: 38, w: 58, rotate: 2, depth: 3, onFrame: true },
      { piece: "leaf-long", x: 66, y: 66, w: 26, rotate: 24, depth: 2, onFrame: true },
      { piece: "loquat-single", x: 4, y: 76, w: 18, rotate: -16, depth: 2, onFrame: true },
      { piece: "clover", x: 84, y: 80, w: 8, rotate: 12, depth: 2, onFrame: true },
    ],
  },
  "cats-cut": {
    id: "cats-cut",
    well: "#efe4d6",
    wrap: "#c4a48c",
    paper: "dots",
    hole: CATS_HOLE,
    print: [
      { d: "M18 44C22 40 28 42 26 47C22 48 20 44 18 44Z", fill: "#e0d0be", opacity: 0.7 },
      { d: "M72 52C76 48 82 50 80 55C76 56 74 52 72 52Z", fill: "#e0d0be", opacity: 0.65 },
    ],
    places: [
      { piece: "daisy", x: 12, y: 28, w: 9, rotate: -12, depth: 1, kind: "print" },
      { piece: "clover", x: 70, y: 30, w: 7, rotate: 10, depth: 1, kind: "print" },
      { piece: "cat-cream-sit", x: 8, y: 24, w: 22, rotate: -4, depth: 1 },
      { piece: "cat-honey-leap", x: 28, y: 10, w: 48, rotate: 8, depth: 1 },
      { piece: "cat-grey-lie", x: 18, y: 78, w: 58, rotate: -6, depth: 1 },
      { piece: "daisy", x: 4, y: 8, w: 12, rotate: -14, depth: 2, onFrame: true },
      { piece: "clover", x: 18, y: 4, w: 8, rotate: 8, depth: 2, onFrame: true },
      { piece: "daisy", x: 78, y: 10, w: 14, rotate: 12, depth: 2, onFrame: true },
      { piece: "cat-honey-loaf", x: 2, y: 52, w: 22, rotate: -8, depth: 3, onFrame: true },
      { piece: "cat-honey-play", x: 58, y: 48, w: 24, rotate: 4, depth: 3, onFrame: true },
      { piece: "cat-grey-sing", x: 72, y: 28, w: 24, rotate: 8, depth: 3, onFrame: true },
      { piece: "daisy", x: 0, y: 78, w: 14, rotate: -6, depth: 2, onFrame: true },
      { piece: "clover", x: 86, y: 72, w: 8, rotate: 16, depth: 2, onFrame: true },
    ],
  },
  "mimosa-cut": {
    id: "mimosa-cut",
    well: "#efe8cc",
    wrap: "#c4b36a",
    paper: "washi",
    hole: MIMOSA_HOLE,
    print: [
      { d: "M16 70C32 62 50 64 58 74C70 64 84 62 96 72", stroke: "#d4c896", strokeWidth: 0.6, opacity: 0.7 },
    ],
    places: [
      { piece: "daisy", x: 16, y: 32, w: 10, rotate: -8, depth: 1, kind: "print" },
      { piece: "clover", x: 68, y: 36, w: 7, rotate: 12, depth: 1, kind: "print" },
      { piece: "cat-cream-sit", x: 36, y: 52, w: 22, rotate: 4, depth: 1 },
      { piece: "mimosa", x: -8, y: 8, w: 48, rotate: -18, depth: 2, onFrame: true },
      { piece: "daisy", x: 2, y: 44, w: 14, rotate: -10, depth: 2, onFrame: true },
      { piece: "clover", x: 8, y: 62, w: 9, rotate: 6, depth: 2, onFrame: true },
      { piece: "mimosa", x: 58, y: 6, w: 48, rotate: 16, depth: 2, onFrame: true },
      { piece: "daisy", x: 80, y: 48, w: 14, rotate: 12, depth: 2, onFrame: true },
      { piece: "mimosa", x: 20, y: 58, w: 42, rotate: 8, depth: 3, onFrame: true },
      { piece: "daisy", x: 64, y: 78, w: 12, rotate: -8, depth: 2, onFrame: true },
      { piece: "clover", x: 86, y: 80, w: 8, rotate: 14, depth: 2, onFrame: true },
    ],
  },
  "leaves-cut": {
    id: "leaves-cut",
    well: "#e4ead8",
    wrap: "#8a9464",
    paper: "washi",
    hole: LEAVES_HOLE,
    print: [
      { d: "M12 108C30 96 52 102 70 90C84 82 96 86 102 98", stroke: "#c5ccb0", strokeWidth: 0.6, opacity: 0.75 },
    ],
    places: [
      { piece: "weed-tall", x: 10, y: 32, w: 16, rotate: -10, depth: 1 },
      { piece: "weed-short", x: 68, y: 40, w: 16, rotate: 8, depth: 1 },
      { piece: "daisy", x: 40, y: 28, w: 10, rotate: 6, depth: 1, kind: "print" },
      { piece: "clover", x: 22, y: 50, w: 7, rotate: -8, depth: 1, kind: "print" },
      { piece: "leaf-broad", x: -6, y: 16, w: 36, rotate: -28, depth: 2, onFrame: true },
      { piece: "leaf-long", x: 62, y: 8, w: 34, rotate: 22, depth: 2, onFrame: true },
      { piece: "daisy", x: 4, y: 48, w: 13, rotate: -8, depth: 2, onFrame: true },
      { piece: "leaf-long", x: 48, y: 42, w: 40, rotate: 8, depth: 3, onFrame: true },
      { piece: "weed-short", x: 78, y: 56, w: 18, rotate: 12, depth: 2, onFrame: true },
      { piece: "leaf-broad", x: 8, y: 68, w: 32, rotate: -12, depth: 2, onFrame: true },
      { piece: "daisy", x: 70, y: 78, w: 12, rotate: 10, depth: 2, onFrame: true },
      { piece: "clover", x: 86, y: 84, w: 8, rotate: 16, depth: 2, onFrame: true },
    ],
  },
};

export const BOX_RECIPES: Record<BoxDesignId, BoxRecipe> = {
  ...WINDOW_RECIPES,
  ...CUT_RECIPES,
};
