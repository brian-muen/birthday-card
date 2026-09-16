import type { InkPath } from "./types";

export function circle(cx: number, cy: number, r: number): string {
  const x = +cx.toFixed(2);
  const y = +cy.toFixed(2);
  const rr = +r.toFixed(2);
  return `M${x + rr} ${y}A${rr} ${rr} 0 1 1 ${x - rr} ${y}A${rr} ${rr} 0 1 1 ${x + rr} ${y}Z`;
}

export function oval(cx: number, cy: number, rx: number, ry: number, tilt = 0): string {
  const rad = (tilt * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const p = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return `${+(cx + dx * cos - dy * sin).toFixed(2)} ${+(cy + dx * sin + dy * cos).toFixed(2)}`;
  };
  const k = 0.55228475;
  return `M${p(cx, cy - ry)}C${p(cx + rx * k, cy - ry)} ${p(cx + rx, cy - ry * k)} ${p(cx + rx, cy)}C${p(cx + rx, cy + ry * k)} ${p(cx + rx * k, cy + ry)} ${p(cx, cy + ry)}C${p(cx - rx * k, cy + ry)} ${p(cx - rx, cy + ry * k)} ${p(cx - rx, cy)}C${p(cx - rx, cy - ry * k)} ${p(cx - rx * k, cy - ry)} ${p(cx, cy - ry)}Z`;
}

export function fill(
  d: string,
  color: string,
  extra: Partial<InkPath> = {},
): InkPath {
  return { d, fill: color, ...extra };
}

export function stroke(
  d: string,
  color: string,
  width: number,
  extra: Partial<InkPath> = {},
): InkPath {
  return { d, stroke: color, strokeWidth: width, ...extra };
}

/** Deterministic grain, like a screen print on paper. */
export function stipple(
  cx: number,
  cy: number,
  w: number,
  h: number,
  count: number,
  color: string,
  seed: number,
): InkPath[] {
  const paths: InkPath[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807) % 2147483647;
    const x = cx + ((s % 1000) / 1000) * w;
    s = (s * 16807) % 2147483647;
    const y = cy + ((s % 1000) / 1000) * h;
    s = (s * 16807) % 2147483647;
    const r = 0.35 + ((s % 1000) / 1000) * 0.85;
    paths.push({ d: circle(x, y, r), fill: color, opacity: 0.32 });
  }
  return paths;
}

/** Concentric wave scales — the usual 中紙 behind goldfish, not a side wall. */
export function seigaiha(color: string): InkPath[] {
  const paths: InkPath[] = [];
  const r = 8;
  const dx = 16;
  const dy = 8;
  for (let row = 1; row < 20; row++) {
    const odd = row % 2 ? dx / 2 : 0;
    for (let col = -1; col < 8; col++) {
      const cx = +(col * dx + odd).toFixed(1);
      const cy = +(18 + row * dy).toFixed(1);
      for (const scale of [1, 0.68, 0.38]) {
        const rr = +(r * scale).toFixed(2);
        paths.push({
          d: `M${cx - rr} ${cy}A${rr} ${rr} 0 0 1 ${cx + rr} ${cy}`,
          stroke: color,
          strokeWidth: 0.38,
          opacity: 0.42,
        });
      }
    }
  }
  return paths;
}

/** Laid fibres, like a pale washi insert. */
export function washi(color: string): InkPath[] {
  const lines = [
    28, 36, 47, 58, 71, 84, 96, 109, 122, 134, 148,
  ];
  return lines.map((y, i) => ({
    d: `M-2 ${y}C18 ${y + (i % 2 ? 1.2 : -1)} 38 ${y - 0.8} 62 ${y + 0.6}C78 ${y + 1.1} 92 ${y - 0.4} 102 ${y}`,
    stroke: color,
    strokeWidth: i % 3 === 0 ? 0.55 : 0.32,
    opacity: 0.28,
  }));
}
