import type { PaperPiece } from "../types";
import { clover } from "./clover";
import { note } from "./note";
import { notesBeam } from "./notes-beam";
import { pebble } from "./pebble";
import { RASTER_PIECES } from "./raster";
import { treble } from "./treble";

export const PIECES: Record<string, PaperPiece> = {
  ...RASTER_PIECES,
  [clover.id]: clover,
  [note.id]: note,
  [notesBeam.id]: notesBeam,
  [pebble.id]: pebble,
  [treble.id]: treble,
};
