import type { ReactNode } from "react";

import { DesktopIcons, DesktopProvider } from "@/components/os/desktop";
import HelpButton from "@/components/os/help";
import MenuBar, { type MenuBarBirthday } from "@/components/os/menu-bar";
import { parseStock, stockHex } from "@/lib/stock";

/**
 * The screen every page lives on: the whole viewport, a menu bar across the
 * top and wallpaper under everything else. Windows float over the wallpaper;
 * the page's `icons` sit on it, Help last.
 *
 * `stock` tints the wallpaper and its pattern from the card's paper, so the
 * desktop always belongs to the card being made or read; windows keep the
 * system's own chrome. `birthday` swaps
 * the menu bar date for a greeting on the day.
 */
export default function Computer({
  stock,
  icons,
  status,
  birthday,
  initialClosed,
  children,
}: {
  stock?: string;
  icons?: ReactNode;
  status?: ReactNode;
  birthday?: MenuBarBirthday | null;
  /** App ids whose windows stay closed until an icon opens them. */
  initialClosed?: readonly string[];
  children: ReactNode;
}) {
  return (
    <div
      className="computer"
      data-stock={stock ? parseStock(stock) : undefined}
      style={stock ? { ["--wallpaper" as string]: stockHex(stock) } : undefined}
    >
      <MenuBar status={status} birthday={birthday} />
      <DesktopProvider initialClosed={initialClosed}>
        <main className="os-desktop">{children}</main>
        <DesktopIcons>
          {icons}
          <HelpButton />
        </DesktopIcons>
      </DesktopProvider>
    </div>
  );
}
