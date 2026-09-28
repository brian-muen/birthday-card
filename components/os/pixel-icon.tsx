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
  disk: (
    <>
      <path d="M1 1h12l2 2v12H1z" fill="#a8c6e8" />
      <path d="M4 1h7v5H4zM3 9h10v6H3z" fill={SHEET} />
      <path d="M1.5 1.5h11.3l1.7 1.7v11.3h-13zM4.5 1.5v4h6v-4M3.5 14.5v-5h9v5" fill="none" stroke={INK} />
      <path d="M8 2h2v3H8zM5 11h6v1H5zM5 13h4v1H5z" fill={INK} />
    </>
  ),
  person: (
    <>
      <path d="M5 2h6v6H5zM2 10h12v5H2z" fill="#f2a7b8" />
      <path d="M5.5 2.5h5v5h-5zM2.5 10.5h11v4h-11z" fill="none" stroke={INK} />
    </>
  ),
  signout: (
    <>
      <path d="M2 1h8v14H2z" fill={SHEET} />
      <path d="M2.5 1.5h7v13h-7z" fill="none" stroke={INK} />
      <path d="M4 3h4v10H4z" fill="#a8c6e8" />
      <path d="M6 8h1v1H6z" fill={INK} />
      <path d="M8 7h4v2H8zM12 5h1v6h-1zM13 6h1v4h-1zM14 7h1v2h-1z" fill="#b33a2e" />
    </>
  ),
  cake: (
    <>
      <path d="M7 1h2v2H7z" fill="#f5cf4b" />
      <path d="M7 3h2v4H7z" fill="#f2a7b8" />
      <path d="M3 8h10v2H3zM1 11h14v3H1z" fill={SHEET} />
      <path d="M1 12h14v1H1z" fill="#f2a7b8" />
      <path
        d="M7 0h2v1H7zM6 1h1v6H6zM9 1h1v6H9zM2 7h12v1H2zM2 8h1v2H2zM13 8h1v2h-1zM0 10h16v1H0zM0 11h1v3H0zM15 11h1v3h-1zM0 14h16v1H0z"
        fill={INK}
      />
    </>
  ),
  sound: (
    <>
      <path d="M2 6h3l3-3h1v10H8l-3-3H2z" fill={SHEET} />
      <path d="M2.5 6.5h2.5l3-3h.5v9H8l-3-3H2.5z" fill="none" stroke={INK} />
      <path d="M11 6h1v4h-1zM13 4h1v8h-1z" fill={INK} />
    </>
  ),
  mute: (
    <>
      <path d="M2 6h3l3-3h1v10H8l-3-3H2z" fill={SHEET} />
      <path d="M2.5 6.5h2.5l3-3h.5v9H8l-3-3H2.5z" fill="none" stroke={INK} />
      <path d="M11 6h1v1h-1zM14 6h1v1h-1zM12 7h2v2h-2zM11 9h1v1h-1zM14 9h1v1h-1z" fill={INK} />
    </>
  ),
  help: (
    <>
      <path d="M1 1h14v11H1z" fill="#f5cf4b" />
      <path d="M1.5 1.5h13v10h-13z" fill="none" stroke={INK} />
      <path
        d="M3 12h3v1H3zM3 13h2v1H3zM3 14h1v1H3zM6 3h4v1H6zM5 4h1v1H5zM10 4h1v2h-1zM9 6h1v1H9zM7 7h2v1H7zM7 9h2v1H7z"
        fill={INK}
      />
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

type DesktopIconTarget =
  | { href: string; download?: boolean }
  | { onClick: () => void }
  | { action: (formData: FormData) => void | Promise<void> };

/** A labelled icon on the desktop that opens a page or runs an action; `AppIcon` opens a window. */
export function DesktopIcon({
  icon,
  label,
  ...target
}: { icon: PixelIconName; label: string } & DesktopIconTarget) {
  const body = (
    <>
      <PixelIcon name={icon} />
      <span className="os-icon-label">{label}</span>
    </>
  );
  if ("action" in target) {
    return (
      <form action={target.action} className="os-icon-form">
        <button type="submit" className="os-icon">
          {body}
        </button>
      </form>
    );
  }
  if ("onClick" in target) {
    return (
      <button type="button" className="os-icon" onClick={target.onClick}>
        {body}
      </button>
    );
  }
  return target.download ? (
    <a href={target.href} download className="os-icon">
      {body}
    </a>
  ) : (
    <Link href={target.href} className="os-icon">
      {body}
    </Link>
  );
}
