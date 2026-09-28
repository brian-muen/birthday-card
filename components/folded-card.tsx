"use client";

import type { ReactNode, Ref } from "react";
import { stockHex } from "@/lib/stock";

export const SPREAD_QUERY = "(min-width: 52rem)";
export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function subscribeToQuery(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      list.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  };
}

export const subscribeToSpread = subscribeToQuery(SPREAD_QUERY);
export const subscribeToMotion = subscribeToQuery(MOTION_QUERY);
export const getSpread = () => window.matchMedia(SPREAD_QUERY).matches;
export const getReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
export const getServerFalse = () => false;

type FrameHandlers = Partial<
  Pick<
    React.HTMLAttributes<HTMLDivElement>,
    | "onPointerDown"
    | "onPointerMove"
    | "onPointerUp"
    | "onPointerCancel"
    | "onClickCapture"
  >
>;

export function CardObject({
  stock,
  spread = false,
  variant,
  frameRef,
  handlers,
  children,
}: {
  stock: string;
  spread?: boolean;
  variant?: "home";
  frameRef?: Ref<HTMLDivElement>;
  handlers?: FrameHandlers;
  children: ReactNode;
}) {
  return (
    <div
      ref={frameRef}
      className="card-frame"
      data-spread={spread}
      data-variant={variant}
      style={{ ["--card-stock" as string]: stockHex(stock) }}
      {...handlers}
    >
      <div className="card-seat">
        <div className="card-contact-shadow" aria-hidden />
        <div className="card-stage">
          <div className="card-world">
            <div aria-hidden className="card-panel" data-half="right" data-stock="liner">
              <span className="card-crease" data-side="right" />
            </div>
            {spread ? (
              <div aria-hidden className="card-panel" data-half="left" data-stock="liner">
                <span className="card-crease" data-side="left" />
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSheet({
  cover = false,
  children,
}: {
  cover?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="card-leaf" data-cover={cover}>
      <div className="card-sheet">
        {children}
        <span className="card-edge" data-edge="fore" aria-hidden />
        <span className="card-edge" data-edge="head" aria-hidden />
        <span className="card-edge" data-edge="foot" aria-hidden />
      </div>
    </div>
  );
}

export function FaceChrome({ side }: { side: "left" | "right" }) {
  return (
    <>
      <span className="card-crease" data-side={side} aria-hidden />
      <span className="card-cast" aria-hidden />
      <span className="card-light" aria-hidden />
    </>
  );
}
