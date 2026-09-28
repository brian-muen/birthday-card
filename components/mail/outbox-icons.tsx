const INK = "#1f1b2e";
const CANDLE = "#f5cf4b";

/** Pixel icons the foundation set doesn't have, drawn on the same 16-pixel grid. */
const ICONS = {
  gift: (
    <>
      <path d="M1 6h14v3H1zM2 9h12v6H2z" fill="#f2a7b8" />
      <path d="M7 6h2v9H7zM5 3h2v1h1v2H5zM9 3h2v3H8V4h1z" fill={CANDLE} />
      <path
        d="M1.5 6.5h13v2h-13zM2.5 8.5h11v6h-11zM7.5 6.5v8M8.5 6.5v8M4.5 2.5h2v1h1v3h-3zM11.5 2.5h-2v1h-1v3h3z"
        fill="none"
        stroke={INK}
      />
    </>
  ),
  lock: (
    <>
      <path d="M3 7h10v8H3z" fill={CANDLE} />
      <path d="M3.5 7.5h9v7h-9zM5.5 7.5v-3h1v-1h3v1h1v3" fill="none" stroke={INK} />
      <path d="M7 10h2v2H7z" fill={INK} />
    </>
  ),
  alert: (
    <>
      <path d="M1 1h14v14H1z" fill={CANDLE} />
      <path d="M1.5 1.5h13v13h-13z" fill="none" stroke={INK} />
      <path d="M7 3h2v7H7zM7 11h2v2H7z" fill={INK} />
    </>
  ),
};

export function MailIcon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
