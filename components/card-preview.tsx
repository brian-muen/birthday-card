import type { CSSProperties } from "react";
import CoverSurface from "@/components/cover-surface";
import { STOCKS, type StockId } from "@/lib/stock";

export default function CardPreview({
  name,
  stock,
  design = "cake",
}: {
  name: string;
  stock: StockId;
  design?: string;
}) {
  const stockColor = STOCKS.find((item) => item.id === stock)?.hex;

  return (
    <aside className="paper-preview-stage" aria-label="Card preview">
      <div
        className="paper-preview"
        style={{ "--card-stock": stockColor } as CSSProperties}
      >
        <div className="paper-preview-thickness" aria-hidden="true" />
        <div className="card-face" data-face="front" data-stock="cover">
          <CoverSurface design={design} recipientName={name} />
        </div>
      </div>
    </aside>
  );
}
