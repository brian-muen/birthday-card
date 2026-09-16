import type { CSSProperties } from "react";
import CoverSurface from "@/components/cover-surface";
import { STOCKS, type StockId } from "@/lib/stock";

export default function CardPreview({
  name,
  stock,
  design = "plain",
  dedication,
  showInside = false,
}: {
  name: string;
  stock: StockId;
  design?: string;
  dedication?: string;
  showInside?: boolean;
}) {
  const stockColor = STOCKS.find((item) => item.id === stock)?.hex;
  const inside = showInside && dedication !== undefined;

  return (
    <aside
      className="paper-preview-stage"
      aria-label={inside ? "Dedication preview" : "Card preview"}
    >
      <div
        className="paper-preview"
        style={{ "--card-stock": stockColor } as CSSProperties}
      >
        <div className="paper-preview-thickness" aria-hidden="true" />
        {inside ? (
          <div className="card-face" data-face="front" data-stock="liner">
            <div className="card-body card-dedication">
              {dedication ? <p>{dedication}</p> : null}
            </div>
          </div>
        ) : (
          <div className="card-face" data-face="front" data-stock="cover">
            <CoverSurface design={design} recipientName={name} />
          </div>
        )}
      </div>
    </aside>
  );
}
