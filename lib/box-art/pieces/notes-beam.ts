import type { PaperPiece } from "../types";

export const notesBeam: PaperPiece = {
  id: "notes-beam",
  viewBox: [0, 0, 48, 36],
  paths: [
    {
      d: "M10.4 32.2a5 3.8 0 1 1-7.2-2.8 5 3.8 0 0 1 7.2 2.8Z",
      fill: "#3d3a36",
      stroke: "#2a2724",
      strokeWidth: 0.85,
    },
    {
      d: "M34.8 30.6a5 3.8 0 1 1-7.2-2.8 5 3.8 0 0 1 7.2 2.8Z",
      fill: "#3d3a36",
      stroke: "#2a2724",
      strokeWidth: 0.85,
    },
    {
      d: "M9.8 31.4V8.2M34.2 29.8V6.6",
      stroke: "#2a2724",
      strokeWidth: 1.2,
    },
    {
      d: "M9.4 7.4L34.8 5.4L35.2 9.6L9.8 11.6Z",
      fill: "#3d3a36",
    },
  ],
};
