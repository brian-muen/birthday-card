/**
 * A sprinkle of CSS confetti — tiny tilted squares and dots in the site
 * palette. Absolutely positioned; the parent must be `relative`.
 */
const pieces = [
  // [top, left, size(px), color, tilt(deg), shape]
  { top: "8%", left: "6%", size: 7, color: "var(--accent)", tilt: -18 },
  { top: "22%", left: "13%", size: 5, color: "var(--gold)", tilt: 24 },
  { top: "64%", left: "4%", size: 6, color: "var(--gold)", tilt: 40 },
  { top: "82%", left: "15%", size: 5, color: "var(--accent)", tilt: -30 },
  { top: "10%", left: "90%", size: 6, color: "var(--gold)", tilt: 12 },
  { top: "30%", left: "95%", size: 5, color: "var(--accent)", tilt: -24 },
  { top: "70%", left: "93%", size: 7, color: "var(--accent)", tilt: 30 },
  { top: "88%", left: "84%", size: 4, color: "var(--gold)", tilt: -12 },
] as const;

export default function Confetti({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`absolute inset-0 pointer-events-none ${className}`}>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="confetti confetti-drift"
          style={{
            top: piece.top,
            left: piece.left,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            opacity: 0.55,
            ["--tilt" as string]: `${piece.tilt}deg`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
