const ENVELOPE = "M2 6h12v8H2z";
const OUTLINE = "M2.5 6.5h11v7h-11z";
const FLAP = "M3 7h1v1H3zM12 7h1v1h-1zM4 8h1v1H4zM11 8h1v1h-1zM5 9h1v1H5zM10 9h1v1h-1zM6 10h1v1H6zM9 10h1v1H9z";
const SEAL = "M7 10h2v2H7z";
const CANDLE = "M7 3h2v3H7z";
const FLAME = "M7 1h1v1H7zM7 2h2v1H7z";

/**
 * Birthday Mail: an envelope with a candle tucked in. Drawn on a 16-pixel
 * grid so it stays crisp in the menu bar; `tile` sets it on the cinnabar
 * square used for the favicon.
 */
export function LogoMark({
  className = "",
  tile = false,
}: {
  className?: string;
  tile?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {tile ? <rect width="16" height="16" rx="3" fill="#b33a2e" /> : null}
      <path d={CANDLE} fill="#f2a7b8" />
      <path d={FLAME} fill={tile ? "#f5cf4b" : "#e9a23b"} />
      <path d={ENVELOPE} fill="#fffdf8" />
      <path d={OUTLINE} fill="none" stroke="#1f1b2e" />
      <path d={FLAP} fill="#1f1b2e" />
      <path d={SEAL} fill="#b33a2e" />
    </svg>
  );
}
