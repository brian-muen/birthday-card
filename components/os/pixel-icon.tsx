import Link from "next/link";
import type { ReactNode } from "react";

const INK = "#1f1b2e";
const SHEET = "#fffdf8";

/** 16-pixel desktop icons, drawn on whole pixels so they stay crisp. */
const ICONS = {
  mail: (
    <>
      <path d="M1 3h14v11H1z" fill={SHEET} />
      <path d="M1 3h14v11H1zM1.5 3.5 8 9l6.5-5.5M1.5 13.5 6 8.5M14.5 13.5 10 8.5" fill="none" stroke={INK} />
    </>
  ),
  unread: (
    <>
      <path d="M1 3h14v11H1z" fill="#f5cf4b" />
      <path d="M1 3h14v11H1zM1.5 3.5 8 9l6.5-5.5M1.5 13.5 6 8.5M14.5 13.5 10 8.5" fill="none" stroke={INK} />
    </>
  ),
  card: (
    <>
      <path d="M3 2h10v12H3z" fill="#e7b1a5" />
      <path d="M3.5 2.5h9v11h-9zM8 2.5v11" fill="none" stroke={INK} />
      <path d="M5 6h2v1H5zM9 6h2v1H9zM9 8h2v1H9z" fill={INK} />
    </>
  ),
  folder: (
    <>
      <path d="M1 4h5l1 1h8v9H1z" fill="#a8c6e8" />
      <path d="M1.5 4.5h4.5l1 1h8.5v8.5h-14z" fill="none" stroke={INK} />
    </>
  ),
  compose: (
    <>
      <path d="M2 2h9l3 3v9H2z" fill={SHEET} />
      <path d="M2.5 2.5h8.5l2.5 2.5v8.5h-11z" fill="none" stroke={INK} />
      <path d="M4 6h6v1H4zM4 8h7v1H4zM4 10h5v1H4z" fill={INK} />
    </>
  ),
  keepsake: (
    <>
      <path d="M3 6h10v6H3z" fill={SHEET} />
      <path d="M4.5 1.5h7v4h-7zM1.5 5.5h13v6h-13zM4.5 9.5h7v5h-7z" fill={SHEET} stroke={INK} />
      <path d="M12 7h1v1h-1z" fill="#7bc47f" />
    </>
  ),
  person: (
    <>
      <path d="M5 2h6v6H5zM2 10h12v5H2z" fill="#f2a7b8" />
      <path d="M5.5 2.5h5v5h-5zM2.5 10.5h11v4h-11z" fill="none" stroke={INK} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type PixelIconName = keyof typeof ICONS;

export function PixelIcon({
  name,
  className,
}: {
  name: PixelIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/** A labelled icon on the desktop that opens a page. */
export function DesktopIcon({
  icon,
  label,
  href,
  current = false,
  download = false,
}: {
  icon: PixelIconName;
  label: string;
  href: string;
  current?: boolean;
  download?: boolean;
}) {
  const body = (
    <>
      <PixelIcon name={icon} />
      <span className="os-icon-label">{label}</span>
    </>
  );
  return download ? (
    <a href={href} download className="os-icon">
      {body}
    </a>
  ) : (
    <Link href={href} className="os-icon" aria-current={current ? "page" : undefined}>
      {body}
    </Link>
  );
}
