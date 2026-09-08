import type { CSSProperties } from "react";
import { STOCKS, type StockId } from "@/lib/stock";
import CoverArt from "@/components/cover-art";

function coverNameLength(name: string): "short" | "medium" | "long" {
  if (name.length > 24) return "long";
  if (name.length > 13) return "medium";
  return "short";
}

export default function CardPreview({
  name,
  stock,
  design = "plain",
}: {
  name: string;
  stock: StockId;
  design?: string;
}) {
  const stockColor = STOCKS.find((item) => item.id === stock)?.hex;
  const trimmed = name.trim();
  const shown = trimmed || "Name";

  return (
    <aside className="paper-preview-stage" aria-label="Card preview">
      <div
        className="paper-preview"
        style={{ "--card-stock": stockColor } as CSSProperties}
      >
        <div className="paper-preview-thickness" aria-hidden="true" />
        <div className="card-face" data-face="front" data-stock="cover">
          <span className="card-body card-cover">
            <span className="card-cover-mark" aria-hidden="true" />
            <CoverArt design={design} className="card-cover-art" />
            <span className="card-cover-greeting">Happy birthday</span>
            <span
              className="card-cover-name"
              data-length={coverNameLength(shown)}
              data-empty={trimmed ? undefined : "true"}
              aria-live="polite"
            >
              {shown}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
