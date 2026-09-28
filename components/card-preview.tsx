"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import CoverSurface from "@/components/cover-surface";
import {
  CardObject,
  CardSheet,
  FaceChrome,
  getReducedMotion,
  getServerFalse,
  getSpread,
  subscribeToMotion,
  subscribeToSpread,
} from "@/components/folded-card";
import { useCardTurn } from "@/components/use-card-turn";
import { DEFAULT_DESIGN } from "@/lib/design";
import type { StockId } from "@/lib/stock";

function Face({
  side,
  stock,
  children,
}: {
  side: "left" | "right";
  stock: "cover" | "liner";
  children?: React.ReactNode;
}) {
  return (
    <div
      className="card-face"
      data-face={side === "left" ? "back" : "front"}
      data-stock={stock}
      aria-hidden
    >
      <FaceChrome side={side} />
      {children ?? <div className="card-body" />}
    </div>
  );
}

export default function CardPreview({
  name,
  stock,
  design = DEFAULT_DESIGN,
  compact = false,
}: {
  name: string;
  stock: StockId;
  design?: string;
  compact?: boolean;
}) {
  const wide = useSyncExternalStore(subscribeToSpread, getSpread, getServerFalse);
  const spread = wide && !compact;
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotion,
    getServerFalse,
  );
  const last = 1;
  const [settled, setSettled] = useState({ place: 0, spread });
  const place = settled.spread === spread ? settled.place : 0;
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();

  const { frameRef, sliderRef, goTo, jump, target, frameHandlers, sliderHandlers } =
    useCardTurn({
      last,
      reducedMotion,
      onRest: (t) => {
        setTouched(true);
        if (Number.isInteger(t)) setSettled({ place: t, spread });
      },
    });

  useEffect(() => {
    jump(0);
  }, [spread, jump]);

  const go = useCallback(
    (next: number) => {
      setTouched(true);
      goTo(next > last ? 0 : Math.max(0, next));
    },
    [goTo, last],
  );

  const cardName = trimmed ? `${trimmed}’s card` : "the card";
  const caption = touched
    ? place === 0
      ? "Closed"
      : `Inside ${cardName}`
    : "Drag the cover open";

  return (
    <div className="card-preview" aria-label="Card preview" role="group">
      <CardObject
        stock={stock}
        spread={spread}
        variant="home"
        frameRef={frameRef}
        handlers={frameHandlers}
      >
        <CardSheet cover>
          <button
            type="button"
            onClick={() => go(place === 0 ? 1 : 0)}
            className="card-face"
            data-face="front"
            data-stock="cover"
            aria-label={
              place === 0 ? `Open the preview of ${cardName}` : `Close the preview of ${cardName}`
            }
          >
            <FaceChrome side="right" />
            <CoverSurface design={design} recipientName={name} />
          </button>
          <Face side="left" stock="liner" />
        </CardSheet>
        <CardSheet>
          <Face side="right" stock="liner" />
          <Face side="left" stock="liner" />
        </CardSheet>
      </CardObject>
      <div className="card-scrub">
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={last}
          step="any"
          defaultValue={0}
          className="card-scrub-range"
          aria-label="Open the card preview"
          aria-valuetext={caption}
          onKeyDown={(event) => {
            const delta =
              event.key === "ArrowRight" || event.key === "ArrowUp"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowDown"
                  ? -1
                  : 0;
            if (!delta) return;
            event.preventDefault();
            go(Math.min(last, target() + delta));
          }}
          {...sliderHandlers}
        />
      </div>
    </div>
  );
}
