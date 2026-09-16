import type { PaperPiece } from "../types";

export const note: PaperPiece = {
  id: "note",
  viewBox: [0, 0, 28, 36],
  paths: [
    {
      d: "M8.2 29.5a5.2 4.1 0 1 1-7.4-3.2 5.2 4.1 0 0 1 7.4 3.2Z",
      fill: "#3d3a36",
      stroke: "#2a2724",
      strokeWidth: 0.9,
    },
    {
      d: "M7.6 28.8V6.2L24 3.4v7.2",
      stroke: "#2a2724",
      strokeWidth: 1.15,
    },
    {
      d: "M24 10.4c-3.4 1.8-6.6.6-8.4-1.2 2.2 4.8 7.2 5.4 8.4 1.2Z",
      fill: "#3d3a36",
    },
  ],
};
