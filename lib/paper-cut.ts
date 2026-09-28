// Layered paper-cut covers. Every layer is a sheet of coloured paper stacked
// behind a window cut in the front sheet; each design has its own window.
// Geometry lives in a 100 × 140 box (the card's 5:7) and bleeds past it, so
// deeper sheets can slide for parallax.
// Holes are wound opposite to their outline so the nonzero fill rule used
// by pdf-lib cuts them the same way the browser does.

export const CUT_W = 100;
export const CUT_H = 140;

export const PAPER_CUT_IDS = ["cut-cake", "cut-balloons", "moon", "plum", "koi", "lanterns"] as const;
export type PaperCutId = (typeof PAPER_CUT_IDS)[number];

export function isPaperCut(id: string): id is PaperCutId {
  return (PAPER_CUT_IDS as readonly string[]).includes(id);
}

export type CutShape = { d: string; fill: string };
/** `frame` sheets are the card itself; everything else is scenery behind it. */
export type CutLayer = { shapes: CutShape[]; frame?: boolean };
export type PaperCutDesign = {
  id: PaperCutId;
  layers: CutLayer[];
  text: string;
  stage: string;
};

type Pt = [number, number];

const BLEED = 10;
const f = (n: number) => String(Math.round(n * 100) / 100);

function rect(x: number, y: number, w: number, h: number) {
  return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
}

const sheet = () => rect(-BLEED, -BLEED, CUT_W + BLEED * 2, CUT_H + BLEED * 2);

function poly(points: Pt[]) {
  return `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
}

/** Positive when the outline runs clockwise on screen, like `sheet()`. */
function signedArea(points: Pt[]) {
  let sum = 0;
  points.forEach(([x0, y0], i) => {
    const [x1, y1] = points[(i + 1) % points.length];
    sum += x0 * y1 - x1 * y0;
  });
  return sum / 2;
}

function hole(points: Pt[]) {
  return poly(signedArea(points) > 0 ? [...points].reverse() : points);
}

function arc(cx: number, cy: number, r: number, from: number, to: number, steps: number): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return points;
}

function circle(cx: number, cy: number, r: number, hole = false) {
  const sweep = hole ? 0 : 1;
  return `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 ${sweep} ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 ${sweep} ${f(cx - r)} ${f(cy)}Z`;
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
  return `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 1 ${f(cx - rx)} ${f(cy)}Z`;
}

function diamond(cx: number, cy: number, s: number) {
  return `M${f(cx)} ${f(cy - s)}L${f(cx - s)} ${f(cy)}L${f(cx)} ${f(cy + s)}L${f(cx + s)} ${f(cy)}Z`;
}

/** A smooth ridge through `points`, filled down past the bottom edge. */
function ridge(points: Pt[]) {
  const bottom = CUT_H + BLEED;
  const p: Pt[] = [[-BLEED, points[0][1]], ...points, [CUT_W + BLEED, points[points.length - 1][1]]];
  let d = `M${f(p[0][0])} ${f(bottom)}L${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}L${f(p[p.length - 1][0])} ${f(bottom)}Z`;
}

/** A row of wave crests (seigaiha scallops) filled down past the bottom. */
function waves(y: number, r: number, shift: number) {
  const bottom = CUT_H + BLEED;
  let x = -BLEED - shift;
  let d = `M${f(x)} ${f(bottom)}L${f(x)} ${f(y)}`;
  while (x < CUT_W + BLEED) {
    d += `A${f(r)} ${f(r)} 0 0 1 ${f(x + r * 2)} ${f(y)}`;
    x += r * 2;
  }
  return `${d}L${f(x)} ${f(bottom)}Z`;
}

function cloud(cx: number, cy: number, s: number) {
  return [
    circle(cx - 6 * s, cy, 4 * s),
    circle(cx, cy - 2.5 * s, 5.5 * s),
    circle(cx + 6.5 * s, cy - 0.5 * s, 4.2 * s),
    rect(cx - 10 * s, cy, 20.7 * s, 4 * s),
  ].join("");
}

function star(cx: number, cy: number, s: number) {
  return `M${f(cx)} ${f(cy - s)}Q${f(cx)} ${f(cy)} ${f(cx + s)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy + s)}Q${f(cx)} ${f(cy)} ${f(cx - s)} ${f(cy)}Q${f(cx)} ${f(cy)} ${f(cx)} ${f(cy - s)}Z`;
}

function place(points: Pt[], at: { x: number; y: number; s: number; turn: number; flip?: boolean }) {
  const a = (at.turn * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return points.map(([x0, y]) => {
    const x = at.flip ? -x0 : x0;
    return [at.x + (x * cos - y * sin) * at.s, at.y + (x * sin + y * cos) * at.s] as Pt;
  });
}

function fish(at: { x: number; y: number; s: number; turn: number; flip?: boolean }) {
  const [nose, t1a, t1b, tailTop, tailMid, tailBot, t2a, t2b, back, belly, eye] = place(
    [
      [12, 0],
      [8, -5.5],
      [-2, -6],
      [-12, -5.5],
      [-9.5, 0],
      [-12, 5.5],
      [-2, 6],
      [8, 5.5],
      [-7, -1.4],
      [-7, 1.4],
      [7.5, -1.6],
    ],
    at,
  );
  let d = `M${f(nose[0])} ${f(nose[1])}`;
  d += `C${f(t1a[0])} ${f(t1a[1])} ${f(t1b[0])} ${f(t1b[1])} ${f(back[0])} ${f(back[1])}`;
  d += `L${f(tailTop[0])} ${f(tailTop[1])}`;
  d += `Q${f(tailMid[0])} ${f(tailMid[1])} ${f(tailBot[0])} ${f(tailBot[1])}`;
  d += `L${f(belly[0])} ${f(belly[1])}`;
  d += `C${f(t2a[0])} ${f(t2a[1])} ${f(t2b[0])} ${f(t2b[1])} ${f(nose[0])} ${f(nose[1])}Z`;
  const winding = at.flip ? 0 : 1;
  const r = 0.9 * at.s;
  d += `M${f(eye[0] - r)} ${f(eye[1])}A${f(r)} ${f(r)} 0 1 ${winding} ${f(eye[0] + r)} ${f(eye[1])}A${f(r)} ${f(r)} 0 1 ${winding} ${f(eye[0] - r)} ${f(eye[1])}Z`;
  return d;
}

/** A tapered stroke along `points`, as one filled outline. */
function limb(points: Pt[], from: number, to: number) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  points.forEach((point, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (from + (to - from) * (i / (points.length - 1))) / 2;
    left.push([point[0] - (dy / len) * w, point[1] + (dx / len) * w]);
    right.push([point[0] + (dy / len) * w, point[1] - (dx / len) * w]);
  });
  const outline = [...left, ...right.reverse()];
  return `M${outline.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
}

function blossom(cx: number, cy: number, r: number, turn = 0) {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a = ((turn + i * 72 - 90) * Math.PI) / 180;
    d += circle(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5);
  }
  return d;
}

function ring(cx: number, cy: number, radius: number, count: number, dot: number) {
  let d = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    d += circle(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, dot);
  }
  return d;
}

function lantern(cx: number, top: number, w: number, h: number) {
  const cy = top + h / 2;
  const cap = h * 0.12;
  return [
    { d: rect(cx - 0.3, -BLEED, 0.6, top + BLEED - cap + 0.4), fill: "#7a3b22" },
    { d: ellipse(cx, cy, w / 2, h / 2), fill: "#c7362c" },
    { d: ellipse(cx, cy, w * 0.2, h / 2 - 0.4), fill: "#a62a24" },
    { d: rect(cx - w * 0.26, top - cap * 0.6, w * 0.52, cap), fill: "#d8a546" },
    { d: rect(cx - w * 0.26, top + h - cap * 0.4, w * 0.52, cap), fill: "#d8a546" },
    { d: rect(cx - 0.45, top + h + cap * 0.6, 0.9, h * 0.34), fill: "#d8a546" },
  ];
}

/** A round-topped cake tier: a band with an oval rim above and below. */
function tier(cx: number, top: number, w: number, h: number) {
  const rim = w * 0.08;
  return rect(cx - w / 2, top, w, h) + ellipse(cx, top, w / 2, rim) + ellipse(cx, top + h, w / 2, rim);
}

/** A stripe that wraps the front of a tier, following its curve. */
function band(cx: number, y: number, w: number, h: number) {
  const rx = w / 2;
  const ry = w * 0.08;
  return `M${f(cx - rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(y)}V${f(y + h)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(y + h)}Z`;
}

/** Icing over a tier's top, running down the front in rounded drips. */
function icing(cx: number, top: number, w: number, drips: number[]) {
  const rx = w / 2;
  const ry = w * 0.08;
  const base = top + ry * 0.9;
  const step = w / drips.length;
  const hw = step * 0.3;
  let d = `M${f(cx - rx)} ${f(top)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(top)}V${f(base)}`;
  for (let i = drips.length - 1; i >= 0; i--) {
    const x = cx - rx + step * (i + 0.5);
    const lip = base + Math.sin(((x - (cx - rx)) / w) * Math.PI) * ry * 0.9;
    d += `Q${f(x + hw * 1.6)} ${f(lip + 0.6)} ${f(x + hw)} ${f(lip + 0.8)}`;
    d += `V${f(lip + drips[i])}A${f(hw)} ${f(hw)} 0 0 1 ${f(x - hw)} ${f(lip + drips[i])}V${f(lip + 0.8)}`;
  }
  return `${d}Q${f(cx - rx)} ${f(base)} ${f(cx - rx)} ${f(base)}Z`;
}

/** A teardrop flame: pointed at the tip, round at the wick. */
function flame(cx: number, top: number, w: number, h: number) {
  return `M${f(cx)} ${f(top)}C${f(cx + w * 1.15)} ${f(top + h * 0.45)} ${f(cx + w)} ${f(top + h)} ${f(cx)} ${f(top + h)}C${f(cx - w)} ${f(top + h)} ${f(cx - w * 1.15)} ${f(top + h * 0.45)} ${f(cx)} ${f(top)}Z`;
}

function candle(cx: number, base: number, h: number): CutShape[] {
  const w = 3.2;
  const x0 = cx - w / 2;
  const top = base - h;
  let stripes = "";
  for (let y = top + 2.6; y < base - 0.8; y += 2.7) {
    stripes += poly([[x0, y], [x0 + w, y - 1.3], [x0 + w, y - 0.2], [x0, y + 1.1]]);
  }
  return [
    { d: rect(x0, top, w, h), fill: "#fdf6ea" },
    { d: stripes, fill: "#86b4cf" },
    { d: rect(cx - 0.25, top - 1.4, 0.5, 1.6), fill: "#5a4040" },
    { d: flame(cx, top - 7.4, 1.9, 6.2), fill: "#f2a13a" },
    { d: flame(cx, top - 4.6, 0.95, 3.4), fill: "#fde6a6" },
  ];
}

/** Triangle flags hanging from a string that sags between two points. */
function bunting(y: number, sag: number, colors: string[]): CutShape[] {
  const at = (x: number) => y + sag * (1 - ((x - 50) / 42) ** 2);
  const string: Pt[] = [];
  for (let x = -BLEED; x <= CUT_W + BLEED; x += 4) string.push([x, at(x)]);
  const flags = colors.map(() => "");
  let i = 0;
  for (let x = 17; x <= 83; x += 8.25, i++) {
    flags[i % colors.length] += poly([[x - 3, at(x - 3)], [x + 3, at(x + 3)], [x, at(x) + 6.2]]);
  }
  return [
    { d: limb(string, 0.45, 0.45), fill: "#9a5a55" },
    ...colors.map((fill, index) => ({ d: flags[index], fill })),
  ];
}

function balloon(cx: number, cy: number, r: number) {
  const knot = `M${f(cx)} ${f(cy + r * 1.18)}L${f(cx - r * 0.18)} ${f(cy + r * 1.42)}L${f(cx + r * 0.18)} ${f(cy + r * 1.42)}Z`;
  return ellipse(cx, cy, r, r * 1.2) + knot;
}

/** A window cut in the front sheet, drawn `inset` units inside its edge. */
type Window = (inset: number) => string;

const arch: Window = (inset) => {
  const left = 14 + inset;
  const right = 86 - inset;
  const r = (right - left) / 2;
  const spring = 48;
  const bottom = 94 - inset;
  return `M${f(left)} ${f(bottom)}H${f(right)}V${f(spring)}A${f(r)} ${f(r)} 0 0 0 ${f(left)} ${f(spring)}Z`;
};

/** A round moon gate. */
const moonGate: Window = (inset) => circle(50, 54, 36 - inset, true);

/** A begonia window: four overlapping lobes with points between them. */
const begonia: Window = (inset) => {
  const lobes: Pt[] = [[13, 0], [0, 13], [-13, 0], [0, -13]];
  const r = 23.4 - inset;
  const points: Pt[] = [];
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const u: Pt = [Math.cos(a), Math.sin(a)];
    let reach = 0;
    for (const [lx, ly] of lobes) {
      const along = u[0] * lx + u[1] * ly;
      const off = lx * lx + ly * ly - along * along;
      if (off <= r * r) reach = Math.max(reach, along + Math.sqrt(r * r - off));
    }
    points.push([50 + u[0] * reach, 55 + u[1] * reach * 1.05]);
  }
  return hole(points);
};

/** A folding fan, opening upward from a pivot below the window. */
const fan: Window = (inset) => {
  const [cx, cy, outer, inner, half] = [50, 112, 86 - inset, 30 + inset, 27];
  const outerTrim = (Math.asin(inset / outer) * 180) / Math.PI;
  const innerTrim = (Math.asin(inset / inner) * 180) / Math.PI;
  return hole([
    ...arc(cx, cy, outer, -90 - half + outerTrim, -90 + half - outerTrim, 60),
    ...arc(cx, cy, inner, -90 + half - innerTrim, -90 - half + innerTrim, 24),
  ]);
};

/** A rectangle with a scalloped, doily-like edge. */
const doily: Window = (inset) => {
  const [x0, y0, x1, y1] = [15 + inset, 17 + inset, 85 - inset, 90 - inset];
  const points: Pt[] = [];
  const edge = (from: Pt, to: Pt, count: number) => {
    const [dx, dy] = [(to[0] - from[0]) / count, (to[1] - from[1]) / count];
    const r = Math.hypot(dx, dy) / 2;
    const heading = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (let i = 0; i < count; i++) {
      const c: Pt = [from[0] + dx * (i + 0.5), from[1] + dy * (i + 0.5)];
      points.push(...arc(c[0], c[1], r, heading + 180, heading + 360, 8).slice(0, -1));
    }
  };
  edge([x0, y0], [x1, y0], 12);
  edge([x1, y0], [x1, y1], 12);
  edge([x1, y1], [x0, y1], 12);
  edge([x0, y1], [x0, y0], 12);
  return hole(points);
};

/** Open sky inside a thin border, with a rolling hill along the bottom. */
const sky: Window = (inset) => {
  const [x0, y0, x1] = [6 + inset, 6 + inset, 94 - inset];
  const hill = (x: number) => 87 - inset + 2.4 * Math.sin(x * 0.075 + 1) + 1.1 * Math.sin(x * 0.19);
  const corner = 4;
  const points: Pt[] = [
    ...arc(x0 + corner, y0 + corner, corner, 180, 270, 6),
    ...arc(x1 - corner, y0 + corner, corner, 270, 360, 6),
  ];
  for (let x = x1; x >= x0; x -= 2) points.push([x, hill(x)]);
  points.push([x0, hill(x0)]);
  return hole(points);
};

function frame(window: Window, inset: number) {
  return `${sheet()}${window(inset)}`;
}

function framed(window: Window, mat: string, front: string): CutLayer[] {
  return [
    { frame: true, shapes: [{ d: frame(window, 2.6), fill: mat }] },
    { frame: true, shapes: [{ d: frame(window, 0), fill: front }] },
  ];
}

const DESIGNS: Record<PaperCutId, PaperCutDesign> = {
  "cut-cake": {
    id: "cut-cake",
    text: "#fbe6cc",
    stage: "#f1d0d0",
    layers: [
      { shapes: [{ d: sheet(), fill: "#f9e7e2" }] },
      {
        shapes: [
          {
            d: [circle(24, 44, 1.1), circle(78, 40, 1.3), circle(30, 66, 0.9), circle(74, 60, 1), circle(20, 56, 0.7)].join(""),
            fill: "#efb4a7",
          },
          {
            d: [diamond(80, 50, 1.2), diamond(22, 34, 1), diamond(70, 72, 0.9), diamond(28, 76, 0.8)].join(""),
            fill: "#f1c77c",
          },
        ],
      },
      {
        shapes: [
          { d: rect(-BLEED, 83, CUT_W + BLEED * 2, 70), fill: "#e0a494" },
          { d: rect(-BLEED, 83, CUT_W + BLEED * 2, 1.4), fill: "#ebbcae" },
        ],
      },
      {
        shapes: [
          {
            d:
              rect(23, 76.6, 54, 1.6) +
              ellipse(50, 76.6, 27, 2.4) +
              ellipse(50, 78.2, 27, 2.4) +
              poly([[46.6, 79.5], [53.4, 79.5], [51.6, 83.6], [48.4, 83.6]]) +
              ellipse(50, 84, 9, 1.7),
            fill: "#cfe2d6",
          },
        ],
      },
      {
        shapes: [
          { d: tier(50, 55, 44, 21), fill: "#fdf2e5" },
          { d: band(50, 66.5, 44, 2.2), fill: "#f2aeb0" },
        ],
      },
      { shapes: [{ d: icing(50, 55, 45, [3.2, 6, 2.4, 4.6, 7, 3, 5.2, 2.6]), fill: "#ea8494" }] },
      { shapes: [...candle(40, 55.8, 10.5), ...candle(50, 54.6, 12), ...candle(60, 55.8, 10.5)] },
      { shapes: bunting(20, 7, ["#e4786e", "#f0c064", "#86b4cf"]) },
      ...framed(doily, "#b3526b", "#8c3048"),
    ],
  },
  "cut-balloons": {
    id: "cut-balloons",
    text: "#f5ecd6",
    stage: "#cfe1ea",
    layers: [
      { shapes: [{ d: sheet(), fill: "#dcebf1" }] },
      { shapes: [{ d: cloud(24, 64, 0.8) + cloud(80, 72, 0.65) + cloud(70, 14, 0.5), fill: "#f4f9fb" }] },
      {
        shapes: [
          {
            d:
              limb([[27, 45], [32, 60], [44, 74], [52, 90]], 0.6, 0.6) +
              limb([[47, 31], [46, 52], [50, 72], [52, 90]], 0.6, 0.6) +
              limb([[70, 43], [64, 60], [56, 76], [52, 90]], 0.6, 0.6) +
              limb([[37, 60], [42, 72], [52, 90]], 0.6, 0.6) +
              limb([[62, 63], [56, 76], [52, 90]], 0.6, 0.6),
            fill: "#5b6770",
          },
        ],
      },
      {
        shapes: [
          { d: balloon(37, 50, 6.8), fill: "#f3a1ae" },
          { d: balloon(62, 53, 6.4), fill: "#8cc5b0" },
        ],
      },
      {
        shapes: [
          { d: balloon(27, 34, 8.5), fill: "#e8665a" },
          { d: ellipse(24, 29.5, 1.8, 3), fill: "#f39a8f" },
          { d: balloon(70, 33, 8), fill: "#f0bf4c" },
          { d: ellipse(67.2, 28.8, 1.7, 2.8), fill: "#f8dc8e" },
          { d: balloon(47, 19, 9.5), fill: "#6f9fd4" },
          { d: ellipse(43.6, 14, 2, 3.2), fill: "#a6c5e8" },
        ],
      },
      { shapes: [{ d: ridge([[4, 79], [22, 75], [40, 80], [62, 74], [84, 79], [96, 76]]), fill: "#b8d6c2" }] },
      { shapes: [{ d: ridge([[4, 86], [24, 82], [50, 87], [74, 81], [96, 85]]), fill: "#8dbb9f" }] },
      ...framed(sky, "#4d7a63", "#2f5a48"),
    ],
  },
  moon: {
    id: "moon",
    text: "#f2e4c4",
    stage: "#cdd3e6",
    layers: [
      {
        shapes: [
          { d: sheet(), fill: "#dde0ec" },
          { d: [star(30, 30, 1.6), star(40, 21, 1), star(80, 24, 1.3), star(24, 44, 0.9)].join(""), fill: "#f6f3ea" },
        ],
      },
      { shapes: [{ d: circle(60, 36, 13), fill: "#f7efdc" }] },
      { shapes: [{ d: cloud(44, 50, 0.9) + cloud(76, 44, 0.7), fill: "#eef0f6" }] },
      { shapes: [{ d: ridge([[4, 64], [16, 57], [30, 63], [45, 56], [57, 64], [71, 55], [86, 62], [96, 58]]), fill: "#aeb5d1" }] },
      { shapes: [{ d: ridge([[4, 75], [14, 70], [28, 77], [42, 68], [55, 74], [68, 67], [82, 74], [96, 69]]), fill: "#8490bb" }] },
      { shapes: [{ d: ridge([[4, 86], [17, 80], [33, 88], [50, 82], [66, 90], [84, 82], [96, 86]]), fill: "#5c6897" }] },
      ...framed(moonGate, "#3d4a7c", "#273161"),
    ],
  },
  plum: {
    id: "plum",
    text: "#f4e7d2",
    stage: "#efd3cf",
    layers: [
      { shapes: [{ d: sheet(), fill: "#f6e8e5" }, { d: circle(34, 36, 11), fill: "#eab2ab" }] },
      { shapes: [{ d: ridge([[4, 74], [20, 66], [40, 72], [60, 62], [82, 70], [96, 64]]), fill: "#efd0cc" }] },
      { shapes: [{ d: ridge([[4, 86], [22, 80], [46, 88], [70, 78], [96, 86]]), fill: "#e0b0b0" }] },
      {
        shapes: [
          {
            d:
              limb([[106, 46], [90, 50], [77, 55], [64, 61], [52, 65], [40, 67]], 3.6, 0.8) +
              limb([[79, 54], [75, 45], [70, 36]], 1.8, 0.6) +
              limb([[62, 62], [59, 71], [54, 78]], 1.5, 0.5),
            fill: "#4f3437",
          },
        ],
      },
      {
        shapes: [
          {
            d: blossom(77, 54, 7.5, 10) + blossom(63, 60, 6.5, 34) + blossom(49, 65, 5.4, 4) + blossom(70, 36, 5.6, 20) + blossom(55, 77, 4.6, 40),
            fill: "#fbf1ee",
          },
          {
            d: circle(77, 54, 1.7) + circle(63, 60, 1.5) + circle(49, 65, 1.3) + circle(70, 36, 1.3) + circle(55, 77, 1.1) + circle(40.5, 67, 1.5) + circle(68, 29.5, 1.4) + circle(86, 49, 1.8),
            fill: "#cf6f7d",
          },
        ],
      },
      ...framed(begonia, "#5d7462", "#3c5246"),
    ],
  },
  koi: {
    id: "koi",
    text: "#f8e0b4",
    stage: "#f1cdb8",
    layers: [
      { shapes: [{ d: sheet(), fill: "#f7e4d4" }, { d: circle(66, 39, 8), fill: "#f2c0a3" }] },
      { shapes: [{ d: waves(50, 6, 0), fill: "#f0c6aa" }] },
      {
        shapes: [
          { d: fish({ x: 37, y: 58, s: 1.05, turn: -14 }), fill: "#fdf4e8" },
          { d: fish({ x: 64, y: 53, s: 0.85, turn: 16, flip: true }), fill: "#e8704f" },
        ],
      },
      { shapes: [{ d: waves(65, 7, 3.5), fill: "#e7a384" }] },
      { shapes: [{ d: waves(74, 6, 1), fill: "#d57459" }] },
      { shapes: [{ d: waves(81.5, 7, 4.5), fill: "#bf5140" }] },
      ...framed(fan, "#a63a30", "#8a2724"),
    ],
  },
  lanterns: {
    id: "lanterns",
    text: "#f3d59b",
    stage: "#efd9a6",
    layers: [
      { shapes: [{ d: sheet(), fill: "#f4dfae" }] },
      {
        shapes: [
          {
            d: ring(32, 30, 9, 12, 0.9) + ring(32, 30, 4.5, 8, 0.7) + ring(72, 22, 7, 10, 0.8) + ring(72, 22, 3.5, 6, 0.6) + ring(60, 72, 6, 9, 0.7),
            fill: "#e7bd78",
          },
        ],
      },
      { shapes: [{ d: `M${-BLEED} ${CUT_H + BLEED}L${-BLEED} 86L18 86Q30 82 36 76L64 76Q70 82 82 86L${CUT_W + BLEED} 86L${CUT_W + BLEED} ${CUT_H + BLEED}Z`, fill: "#d6a462" }] },
      { shapes: lantern(75, 36, 13, 15) },
      { shapes: lantern(29, 40, 14, 16) },
      { shapes: lantern(52, 51, 18, 21) },
      ...framed(arch, "#9c2b27", "#5f1c1f"),
    ],
  },
};

export function paperCut(id: PaperCutId): PaperCutDesign {
  return DESIGNS[id];
}

/**
 * How far a layer sits behind the front sheet, in layer steps. The front
 * sheet is 0; the mat just behind it is a sliver; scenery recedes from there.
 */
export function layerDepth(design: PaperCutDesign, index: number) {
  const last = design.layers.length - 1;
  if (index === last) return 0;
  if (design.layers[index].frame) return 0.35;
  const firstFrame = design.layers.findIndex((layer) => layer.frame);
  return 1 + (firstFrame - 1 - index) * 0.6;
}
