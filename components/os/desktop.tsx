"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

import { PixelIcon, type PixelIconName } from "@/components/os/pixel-icon";
import { zoomRects } from "@/components/os/zoom-rects";

type Desktop = {
  isOpen: (app: string) => boolean;
  open: (app: string, from?: Element | null) => void;
  close: (app: string) => void;
};

const DesktopContext = createContext<Desktop>({
  isOpen: () => true,
  open: () => {},
  close: () => {},
});

/** The close box of any window inside an `AppWindow` closes that app. */
export const AppCloseContext = createContext<(() => void) | null>(null);

const windowOf = (app: string) =>
  document.querySelector<HTMLElement>(`[data-app-window="${app}"] .os-window`);
const iconOf = (app: string) => document.querySelector<HTMLElement>(`[data-app-icon="${app}"]`);

/**
 * Hands focus back to the desktop after a window closes: its icon, or the
 * front window when icons are hidden (phones, while another app is open).
 */
export function focusDesktop(icon: HTMLElement | null) {
  icon?.focus({ preventScroll: true });
  if (icon && document.activeElement === icon) return;
  const windows = document.querySelectorAll<HTMLElement>(".os-app .os-window");
  windows[windows.length - 1]?.focus({ preventScroll: true });
}

/** Which app windows are open. Every app starts open; its icon reopens it. */
export function DesktopProvider({ children }: { children: ReactNode }) {
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());

  const desktop = useMemo<Desktop>(
    () => ({
      isOpen: (app) => !closed.has(app),
      open(app, from) {
        const wasOpen = windowOf(app) != null;
        const fromRect = from?.getBoundingClientRect();
        if (!wasOpen) {
          flushSync(() =>
            setClosed((prev) => {
              const next = new Set(prev);
              next.delete(app);
              return next;
            }),
          );
        }
        const win = windowOf(app);
        if (!win) return;
        win.focus({ preventScroll: wasOpen });
        if (!wasOpen) zoomRects(fromRect, win, { hide: win });
      },
      close(app) {
        const from = windowOf(app)?.getBoundingClientRect();
        flushSync(() => setClosed((prev) => new Set(prev).add(app)));
        const icon = iconOf(app);
        zoomRects(from, icon);
        focusDesktop(icon);
      },
    }),
    [closed],
  );

  return <DesktopContext value={desktop}>{children}</DesktopContext>;
}

export function useDesktop() {
  return useContext(DesktopContext);
}

/**
 * One app's windows. Unmounted while the app is closed; pages that must keep
 * what was typed hold that state above this. `open` overrides the desktop's
 * state for apps that manage their own.
 */
export function AppWindow({
  app,
  open,
  children,
}: {
  app: string;
  open?: boolean;
  children: ReactNode;
}) {
  const desktop = useDesktop();
  if (!(open ?? desktop.isOpen(app))) return null;
  return (
    <AppCloseContext value={() => desktop.close(app)}>
      <div className="os-app" data-app-window={app}>
        {children}
      </div>
    </AppCloseContext>
  );
}

/** A desktop icon that opens its app's window, or brings it to the front. */
export function AppIcon({
  app,
  icon,
  label,
}: {
  app: string;
  icon: PixelIconName;
  label: string;
}) {
  const desktop = useDesktop();
  return (
    <button
      type="button"
      className="os-icon"
      data-app-icon={app}
      data-open={desktop.isOpen(app) || undefined}
      onClick={(event) => desktop.open(app, event.currentTarget)}
    >
      <PixelIcon name={icon} />
      <span className="os-icon-label">{label}</span>
    </button>
  );
}

/**
 * The icons on the wallpaper. Clicking one selects it until something else
 * on the screen is clicked, the way a desktop keeps its selection.
 */
export function DesktopIcons({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function select(event: PointerEvent) {
      const nav = ref.current;
      if (!nav) return;
      const target = event.target instanceof Element ? event.target : null;
      const icon = target?.closest(".os-icon");
      const picked = icon && nav.contains(icon) ? icon : null;
      nav.querySelectorAll("[data-selected]").forEach((el) => {
        if (el !== picked) el.removeAttribute("data-selected");
      });
      picked?.setAttribute("data-selected", "");
    }
    document.addEventListener("pointerdown", select);
    return () => document.removeEventListener("pointerdown", select);
  }, []);

  return (
    <nav ref={ref} className="os-icons" aria-label="Desktop">
      {children}
    </nav>
  );
}
