"use client";

import CoverThumb from "@/components/mail/outbox-thumb";
import { PICKER_DESIGNS, type DesignId } from "@/lib/design";
import { STOCKS, type StockId } from "@/lib/stock";

export default function ComposeStationery({
  design,
  stock,
  onDesign,
  onStock,
}: {
  design: DesignId;
  stock: StockId;
  onDesign: (id: DesignId) => void;
  onStock: (id: StockId) => void;
}) {
  const coverLabel = PICKER_DESIGNS.find((option) => option.id === design)?.label;
  const paper = STOCKS.find((option) => option.id === stock);

  return (
    <div className="compose-stationery" style={{ ["--card-stock" as string]: paper?.hex }}>
      <h3 className="compose-stationery-title">Stationery</h3>
      <fieldset className="compose-set">
        <legend className="compose-legend">
          Cover <span>{coverLabel}</span>
        </legend>
        <div className="compose-covers">
          {PICKER_DESIGNS.map((option) => (
            <label key={option.id} className="compose-cover" title={option.label}>
              <input
                type="radio"
                name="design"
                value={option.id}
                checked={design === option.id}
                onChange={() => onDesign(option.id)}
                className="sr-only"
              />
              <CoverThumb design={option.id} className="compose-thumb" />
              <span className="sr-only">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="compose-set">
        <legend className="compose-legend">
          Paper <span>{paper?.label}</span>
        </legend>
        <div className="compose-papers">
          {STOCKS.map((option) => (
            <label key={option.id} className="compose-paper" title={option.label}>
              <input
                type="radio"
                name="stock"
                value={option.id}
                checked={stock === option.id}
                onChange={() => onStock(option.id)}
                className="sr-only"
              />
              <span
                className="compose-swatch"
                style={{ backgroundColor: option.hex }}
                aria-hidden="true"
              />
              <span className="sr-only">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
