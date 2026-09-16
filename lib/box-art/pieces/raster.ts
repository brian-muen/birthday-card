import type { PaperPiece } from "../types";

function raster(
  id: string,
  file: string,
  width: number,
  height: number,
): PaperPiece {
  return {
    id,
    viewBox: [0, 0, width, height],
    paths: [],
    src: `/box-art/${file}`,
  };
}

const RASTER = [
  raster("piano", "piano.png", 720, 680),
  raster("cat-honey-play", "cat-honey-play.png", 528, 671),
  raster("cat-honey-leap", "cat-honey-leap.png", 720, 552),
  raster("cat-grey-lie", "cat-grey-lie.png", 720, 273),
  raster("cat-cream-sit", "cat-cream-sit.png", 573, 668),
  raster("cat-honey-loaf", "cat-honey-loaf.png", 657, 669),
  raster("cat-grey-sing", "cat-grey-sing.png", 453, 685),
  raster("goldfish", "goldfish.png", 720, 513),
  raster("goldfish-small", "goldfish-small.png", 720, 521),
  raster("loquat-cluster", "loquat-cluster.png", 720, 510),
  raster("loquat-single", "loquat-single.png", 495, 664),
  raster("mimosa", "mimosa.png", 720, 515),
  raster("daisy", "daisy.png", 627, 609),
  raster("score", "score.png", 720, 357),
  raster("leaf-broad", "leaf-broad.png", 720, 359),
  raster("leaf-long", "leaf-long.png", 720, 359),
  raster("weed-tall", "weed-tall.png", 720, 620),
  raster("weed-short", "weed-short.png", 720, 620),
];

export const RASTER_PIECES: Record<string, PaperPiece> = Object.fromEntries(
  RASTER.map((piece) => [piece.id, piece]),
);
