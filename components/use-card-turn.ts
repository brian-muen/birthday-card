"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * One number, `t`, describes the whole card: leaf i is turned by
 * clamp(t - i, 0, 1). Drag, slider, clicks, and keys all move `t`;
 * paintCard writes it into CSS variables without re-rendering React.
 */

const STIFFNESS = 150;
const DAMPING = 2 * Math.sqrt(STIFFNESS);
const DRAG_SLOP = 6;
const FLICK = 0.18;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, input, textarea, select, label, dialog, [data-no-drag], .ui-button, .quiet-link",
      ),
    )
  );
}

export function paintCard(frame: HTMLElement | null, t: number) {
  if (!frame) return;
  const leaves = frame.querySelectorAll<HTMLElement>(".card-leaf");
  const count = leaves.length;
  let castRight = 0;
  let castLeft = 0;
  let anyMoving = false;
  leaves.forEach((leaf, index) => {
    const turn = clamp(t - index, 0, 1);
    const moving = turn > 0.0005 && turn < 0.9995;
    const lift = Math.sin(turn * Math.PI);
    const depth = Math.min(count - index, 12) * (1 - turn) + Math.min(index + 1, 12) * turn;
    leaf.style.setProperty("--turn", turn.toFixed(4));
    leaf.style.setProperty("--sheet-z", (depth + lift * 1.5).toFixed(3));
    leaf.style.zIndex = String(moving ? count + 20 : turn >= 0.5 ? index + 1 : count - index);
    leaf.dataset.moving = String(moving);
    leaf.dataset.turned = String(turn >= 0.5);
    if (moving) {
      anyMoving = true;
      castRight = Math.max(castRight, lift * (1 - turn));
      castLeft = Math.max(castLeft, lift * turn);
    }
  });
  frame.style.setProperty("--open", clamp(t, 0, 1).toFixed(4));
  frame.style.setProperty("--cast-r", castRight.toFixed(3));
  frame.style.setProperty("--cast-l", castLeft.toFixed(3));
  frame.dataset.open = String(t > 0.002);
  frame.dataset.moving = String(anyMoving);
}

export function useCardTurn({
  last,
  reducedMotion,
  onRest,
}: {
  last: number;
  reducedMotion: boolean;
  onRest?: (t: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const motion = useRef({ t: 0, v: 0, target: 0, raf: 0, last: 0 });
  const suppressClick = useRef(false);
  const lastRef = useRef(last);
  const onRestRef = useRef(onRest);
  const reducedRef = useRef(reducedMotion);

  useLayoutEffect(() => {
    lastRef.current = last;
    onRestRef.current = onRest;
    reducedRef.current = reducedMotion;
  });

  const paint = useCallback(() => {
    paintCard(frameRef.current, motion.current.t);
    const slider = sliderRef.current;
    if (slider) slider.value = String(clamp(motion.current.t, 0, lastRef.current));
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(motion.current.raf);
    motion.current.raf = 0;
  }, []);

  const stepRef = useRef<(now: number) => void>(() => {});
  const step = useCallback(
    (now: number) => {
      const m = motion.current;
      let elapsed = Math.min(0.5, (now - m.last) / 1000 || 0.016);
      m.last = now;
      while (elapsed > 0) {
        const dt = Math.min(elapsed, 1 / 120);
        const force = -STIFFNESS * (m.t - m.target) - DAMPING * m.v;
        m.v += force * dt;
        m.t += m.v * dt;
        elapsed -= dt;
      }
      if (Math.abs(m.t - m.target) < 0.002 && Math.abs(m.v) < 0.03) {
        m.t = m.target;
        m.v = 0;
        m.raf = 0;
        paint();
        onRestRef.current?.(m.target);
        return;
      }
      paint();
      m.raf = requestAnimationFrame(stepRef.current);
    },
    [paint],
  );
  useLayoutEffect(() => {
    stepRef.current = step;
  });

  const goTo = useCallback(
    (target: number, velocity?: number) => {
      const m = motion.current;
      m.target = clamp(target, 0, lastRef.current);
      if (velocity !== undefined) m.v = velocity;
      if (reducedRef.current) {
        stop();
        m.t = m.target;
        m.v = 0;
        paint();
        onRestRef.current?.(m.target);
        return;
      }
      if (!m.raf) {
        m.last = performance.now();
        m.raf = requestAnimationFrame(step);
      }
    },
    [paint, step, stop],
  );

  const jump = useCallback(
    (t: number) => {
      stop();
      const m = motion.current;
      m.t = clamp(t, 0, lastRef.current);
      m.target = m.t;
      m.v = 0;
      paint();
    },
    [paint, stop],
  );

  useLayoutEffect(paint);
  useEffect(() => stop, [stop]);

  const target = useCallback(() => Math.round(motion.current.target), []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || isControl(event.target)) return;
    const leaf = frameRef.current?.querySelector<HTMLElement>(".card-leaf");
    const d = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      t0: motion.current.t,
      width: leaf?.getBoundingClientRect().width || 300,
      active: false,
      samples: [] as { t: number; at: number }[],
    };
    suppressClick.current = false;

    function move(e: PointerEvent) {
      if (e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.active) {
        if (Math.hypot(dx, dy) < DRAG_SLOP) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          detach();
          return;
        }
        d.active = true;
        suppressClick.current = true;
        stop();
        d.t0 = motion.current.t;
        frameRef.current?.setAttribute("data-dragging", "true");
      }
      const base = Math.round(d.t0);
      const t = clamp(
        d.t0 - dx / (d.width * 1.7),
        Math.max(0, base - 1),
        Math.min(lastRef.current, base + 1),
      );
      const now = performance.now();
      d.samples.push({ t, at: now });
      while (d.samples.length > 2 && now - d.samples[0].at > 90) d.samples.shift();
      motion.current.t = t;
      motion.current.v = 0;
      paint();
    }

    function end(e: PointerEvent) {
      if (e.pointerId !== d.id) return;
      detach();
      if (!d.active) return;
      frameRef.current?.removeAttribute("data-dragging");
      const first = d.samples[0];
      const latest = d.samples[d.samples.length - 1];
      const span = latest && first ? (latest.at - first.at) / 1000 : 0;
      const velocity = span > 0.008 ? (latest.t - first.t) / span : 0;
      const base = Math.round(d.t0);
      const projected = motion.current.t + velocity * FLICK;
      goTo(
        clamp(Math.round(projected), Math.max(0, base - 1), base + 1),
        clamp(velocity, -8, 8),
      );
    }

    function detach() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onSliderInput(event: React.FormEvent<HTMLInputElement>) {
    jump(Number(event.currentTarget.value));
  }

  function onSliderRelease() {
    goTo(Math.round(motion.current.t));
  }

  return {
    frameRef,
    sliderRef,
    goTo,
    jump,
    target,
    frameHandlers: {
      onPointerDown,
      onClickCapture,
    },
    sliderHandlers: {
      onInput: onSliderInput,
      onPointerUp: onSliderRelease,
    },
  };
}
