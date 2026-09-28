import type { ReactNode } from "react";

import MenuBar, { type Menu } from "@/components/os/menu-bar";
import { stockHex } from "@/lib/stock";

/**
 * The monitor every page lives in. On wide screens it is a beige monitor
 * sitting on the paper tabletop; on phones the bezel drops away and the
 * screen is the viewport.
 *
 * `stock` tints the wallpaper from the card's paper, so the desktop always
 * belongs to the card being made or read.
 */
export default function Computer({
  stock,
  menus = [],
  status,
  chin = "Birthday Mail",
  children,
}: {
  stock?: string;
  menus?: Menu[];
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
          <MenuBar menus={menus} status={status} />
          <main className="os-desktop">{children}</main>
        </div>
        <div className="computer-chin" aria-hidden>
          <span>{chin}</span>
          <span className="computer-led" />
        </div>
      </div>
    </div>
  );
}
