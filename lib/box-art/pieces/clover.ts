import type { PaperPiece } from "../types";

/** Shared botanical, drawn like a small screen-print stamp. */
export const clover: PaperPiece = {
  id: "clover",
  viewBox: [0, 0, 36, 40],
  paths: [
    {
      d: "M18 14c-6.2-8.4-16.4.8-7.6 8.6C2.4 24.2 6.8 36 18 30.2 29.2 36 33.6 24.2 25.6 22.6 34.4 14.8 24.2 5.6 18 14Z",
      fill: "#6f8a5c",
      stroke: "#3f5138",
      strokeWidth: 1.05,
    },
    {
      d: "M18 29.5c.4 3.2.2 6.8.8 9.2",
      stroke: "#3f5138",
      strokeWidth: 1.05,
    },
  ],
};
