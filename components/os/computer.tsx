import type { ReactNode } from "react";

import HelpButton from "@/components/os/help";
import MenuBar from "@/components/os/menu-bar";
import { stockHex } from "@/lib/stock";

/**
 * The monitor every page lives in. On wide screens it is a beige monitor
 * sitting on the paper tabletop; on phones the bezel drops away and the
 * screen is the viewport.
 *
 * `stock` tints the wallpaper from the card's paper, so the desktop always
 * belongs to the card being made or read. `icons` are the page's desktop
 * icons, lined up along the bottom of the screen with Help at the end.
 */
export default function Computer({
  stock,
  icons,
  status,
  chin = "Birthday Mail",
  children,
}: {
  stock?: string;
  icons?: ReactNode;
  status?: ReactNode;
  chin?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="computer">
      <div className="computer-bezel">
        <div
          className="computer-screen"
          style={stock ? { ["--wallpaper" as string]: stockHex(stock) } : undefined}
        >
          <MenuBar status={status} />
          <main className="os-desktop">{children}</main>
          <nav className="os-dock" aria-label="Desktop">
            {icons}
            <HelpButton />
          </nav>
        </div>
        <div className="computer-chin" aria-hidden>
          <span>{chin}</span>
          <span className="computer-led" />
        </div>
      </div>
    </div>
  );
}
