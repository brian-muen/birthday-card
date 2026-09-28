const STEPS = [0.1, 0.25, 0.45, 0.65, 0.82, 1];
const FRAME_MS = 22;

type Box = Element | DOMRect | null | undefined;

function rectOf(box: Box) {
  return box instanceof Element ? box.getBoundingClientRect() : (box ?? null);
}

const mix = (from: number, to: number, t: number) => `${from + (to - from) * t}px`;

/**
 * Classic zoom rects: dotted outlines step from one box to another, telling
 * the eye where a window came from or went. `hide` stays invisible until the
 * last outline lands on it.
 */
export function zoomRects(
  from: Box,
  to: Box,
  { host, hide }: { host?: Element | null; hide?: Element | null } = {},
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = rectOf(from);
  const b = rectOf(to);
  if (!a?.width || !b?.width) return;

  const layer = document.createElement("div");
  layer.className = "os-zoom";
  layer.setAttribute("aria-hidden", "true");
  STEPS.forEach((t, i) => {
    const rect = document.createElement("div");
    rect.className = "os-zoom-rect";
    rect.style.left = mix(a.left, b.left, t);
    rect.style.top = mix(a.top, b.top, t);
    rect.style.width = mix(a.width, b.width, t);
    rect.style.height = mix(a.height, b.height, t);
    rect.animate([{ opacity: 1 }, { opacity: 1 }], {
      delay: i * FRAME_MS,
      duration: FRAME_MS * 2,
    });
    layer.append(rect);
  });
  (host ?? document.body).append(layer);

  const total = (STEPS.length + 1) * FRAME_MS;
  hide?.animate([{ opacity: 0 }, { opacity: 0 }], { duration: total - FRAME_MS });
  window.setTimeout(() => layer.remove(), total + 20);
}
