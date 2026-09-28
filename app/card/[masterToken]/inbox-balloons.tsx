const BALLOONS = [
  { x: 4, size: 5.2, color: "#b33a2e", delay: 40, rise: 1500, tilt: -1 },
  { x: 15, size: 3.8, color: "#f5cf4b", delay: 210, rise: 1650, tilt: 1 },
  { x: 26, size: 4.6, color: "#a8c6e8", delay: 0, rise: 1450, tilt: 1 },
  { x: 38, size: 3.4, color: "#f2a7b8", delay: 300, rise: 1700, tilt: -1 },
  { x: 49, size: 5.6, color: "#f5cf4b", delay: 90, rise: 1550, tilt: -1 },
  { x: 60, size: 4, color: "#9cc59f", delay: 250, rise: 1600, tilt: 1 },
  { x: 71, size: 4.8, color: "#b33a2e", delay: 150, rise: 1500, tilt: -1 },
  { x: 82, size: 3.6, color: "#a8c6e8", delay: 330, rise: 1750, tilt: 1 },
  { x: 91, size: 5, color: "#f2a7b8", delay: 60, rise: 1550, tilt: -1 },
];

function Balloon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 74" aria-hidden="true">
      <path
        d="M20 72c4-5-3-9 1-14s-3-6-1-8"
        fill="none"
        stroke="#1f1b2e"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path d="M17 51l3-5 3 5z" fill={color} stroke="#1f1b2e" strokeWidth="1.25" strokeLinejoin="round" />
      <path
        d="M20 2c10.5 0 18 8.5 18 20 0 13-9.5 22.5-17 24.5h-2C11.5 44.5 2 35 2 22 2 10.5 9.5 2 20 2z"
        fill={color}
        stroke="#1f1b2e"
        strokeWidth="1.5"
      />
      <ellipse cx="12.5" cy="15" rx="3" ry="6" transform="rotate(24 12.5 15)" fill="#fffdf8" opacity="0.55" />
    </svg>
  );
}

/** The Transform flourish: a handful of balloons that rise off the screen once. */
export default function InboxBalloons() {
  return (
    <div className="inbox-balloons" aria-hidden="true">
      {BALLOONS.map((balloon, index) => (
        <span
          key={index}
          className="inbox-balloon"
          style={{
            left: `${balloon.x}%`,
            ["--size" as string]: balloon.size,
            animationDelay: `${balloon.delay}ms`,
            animationDuration: `${balloon.rise}ms`,
            ["--tilt" as string]: balloon.tilt,
          }}
        >
          <span className="inbox-balloon-sway">
            <Balloon color={balloon.color} />
          </span>
        </span>
      ))}
    </div>
  );
}

export function BalloonGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="inbox-glyph" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M6 2h4v1H6zM5 3h6v4H5zM6 7h4v1H6zM7 8h2v1H7z" fill="#f5cf4b" />
      <path d="M6 3h1v2H6z" fill="#fffdf8" />
      <path
        d="M6 1h4v1H6zM5 2h1v1H5zM10 2h1v1h-1zM4 3h1v4H4zM11 3h1v4h-1zM5 7h1v1H5zM10 7h1v1h-1zM6 8h1v1H6zM9 8h1v1H9zM7 9h2v1H7zM8 10h1v1H8zM7 11h1v2H7zM8 13h1v2H8z"
        fill="#1f1b2e"
      />
    </svg>
  );
}
