import { useId } from "react";
import { PIECES } from "@/lib/box-art/pieces";
import { BOX_RECIPES, STAGE, type BoxDesignId } from "@/lib/box-art/recipes";
import type { InkPath, PaperPiece, PiecePlace } from "@/lib/box-art/types";

function nameLength(name: string): "short" | "medium" | "long" {
  if (name.length > 24) return "long";
  if (name.length > 13) return "medium";
  return "short";
}

export default function BoxCover({
  design,
  recipientName = "",
  compact = false,
}: {
  design: BoxDesignId;
  recipientName?: string;
  compact?: boolean;
}) {
  const recipe = BOX_RECIPES[design];
  const name = recipientName.trim();
  const shown = name || "Name";
  const uid = useId().replace(/:/g, "");
  const clipId = `box-cream-${uid}`;
  const lidId = `box-lid-${uid}`;
  const interior = recipe.places.filter((place) => !place.onFrame);
  const stickers = recipe.places.filter((place) => place.onFrame);
  const board = `M0 0H${STAGE.w}V${STAGE.h}H0Z`;

  return (
    <span
      className="card-body box-cover"
      data-design={design}
      data-paper={recipe.paper}
      data-compact={compact ? "true" : undefined}
      style={{
        ["--wrap" as string]: recipe.wrap,
        ["--box-well" as string]: recipe.well,
        ["--paint-pos" as string]: recipe.painting?.position ?? "50% 40%",
        ["--paint-zoom" as string]: String(recipe.painting?.zoom ?? 1),
      }}
    >
      <span className="box-stage">
        <span
          className="box-well"
          data-paper={recipe.painting ? undefined : recipe.paper}
          data-painting={recipe.painting ? "true" : undefined}
          aria-hidden="true"
        >
          {recipe.painting ? (
            <img
              className="box-painting"
              src={recipe.painting.src}
              alt=""
              draggable={false}
            />
          ) : null}
          {recipe.print.length ? (
            <svg className="box-print" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} preserveAspectRatio="none">
              {recipe.print.map((path, index) => (
                <Ink key={index} path={path} />
              ))}
            </svg>
          ) : null}
          {interior.map((place, index) => (
            <PlacedPiece key={`${place.piece}-${index}`} place={place} />
          ))}
        </span>
        <svg className="box-mat" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={lidId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f8f3e9" />
              <stop offset="1" stopColor="#efe6d6" />
            </linearGradient>
            <clipPath id={clipId}>
              <path fillRule="evenodd" d={`${board}${recipe.hole}`} />
            </clipPath>
          </defs>
          <path
            className="box-mat-board"
            fill={`url(#${lidId})`}
            fillRule="evenodd"
            d={`${board}${recipe.hole}`}
          />
          {recipe.facePrint?.length ? (
            <g clipPath={`url(#${clipId})`}>
              {recipe.facePrint.map((path, index) => (
                <Ink key={index} path={path} />
              ))}
            </g>
          ) : null}
          <path className="box-cut-shade" d={recipe.hole} fill="none" />
          <path className="box-cut-lip" d={recipe.hole} fill="none" />
          <path className="box-cut-edge" d={recipe.hole} fill="none" />
          <path className="box-cut-light" d={recipe.hole} fill="none" />
        </svg>
        {stickers.map((place, index) => (
          <PlacedPiece key={`frame-${place.piece}-${index}`} place={place} />
        ))}
        {compact ? null : (
          <span className="box-type">
            <span className="card-cover-greeting">Happy birthday</span>
            <span
              className="card-cover-name"
              data-length={nameLength(shown)}
              data-empty={name ? undefined : "true"}
            >
              {shown}
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

function Ink({ path }: { path: InkPath }) {
  return (
    <path
      d={path.d}
      fill={path.fill ?? "none"}
      stroke={path.stroke}
      strokeWidth={path.strokeWidth ?? 1}
      opacity={path.opacity}
      fillRule={path.fillRule}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function PlacedPiece({ place }: { place: PiecePlace }) {
  const piece = PIECES[place.piece];
  if (!piece) return null;
  const printed = place.kind === "print";
  const style = {
    left: `${place.x}%`,
    top: `${place.y}%`,
    width: `${place.w}%`,
    transform: `rotate(${place.rotate ?? 0}deg)`,
  };
  const attrs = {
    className: "box-piece",
    "data-depth": printed ? undefined : String(place.depth),
    "data-on-frame": place.onFrame ? "true" : undefined,
    "data-print": printed ? "true" : undefined,
    style,
    "aria-hidden": true as const,
  };

  if (piece.src) {
    return (
      <img
        {...attrs}
        src={piece.src}
        alt=""
        draggable={false}
      />
    );
  }

  const [x, y, w, h] = piece.viewBox;
  const pad = printed ? 0 : Math.max(w, h) * 0.08;
  return (
    <svg
      {...attrs}
      viewBox={`${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`}
    >
      {printed ? null : (
        <g
          fill="#fbf7ef"
          stroke="#fbf7ef"
          strokeWidth={pad * 1.35}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {piece.paths.map((path, index) => (
            <path key={`cut-${index}`} d={path.d} fill={path.fill ? "#fbf7ef" : "none"} />
          ))}
        </g>
      )}
      <g>
        {piece.paths.map((path, index) => (
          <Ink key={index} path={defaultStroke(path, piece)} />
        ))}
      </g>
    </svg>
  );
}

function defaultStroke(path: InkPath, piece: PaperPiece): InkPath {
  if (path.strokeWidth != null) return path;
  const [, , w, h] = piece.viewBox;
  return { ...path, strokeWidth: Math.max(w, h) * 0.012 };
}
