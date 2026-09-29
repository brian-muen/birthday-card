"use client";

import CoverPicker from "@/components/mail/cover-picker";
import { type DesignId } from "@/lib/design";
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
  return (
    <div className="compose-stationery">
      <h3 className="compose-stationery-title">Stationery</h3>
      <div className="compose-stationery-rows">
        <label htmlFor="design" className="compose-label">
          Cover
        </label>
        <CoverPicker value={design} onChange={onDesign} />
        <span id="compose-paper" className="compose-label">
          Paper
        </span>
        <div className="compose-papers">
          <div className="compose-swatches" role="radiogroup" aria-labelledby="compose-paper">
            {STOCKS.map((option) => (
              <label key={option.id} className="compose-swatch-label">
                <input
                  type="radio"
                  name="stock"
                  value={option.id}
                  checked={option.id === stock}
                  onChange={() => onStock(option.id)}
                  className="compose-swatch"
                  style={{ backgroundColor: option.hex }}
                />
                <span className="sr-only">{option.label}</span>
              </label>
            ))}
          </div>
          <span className="compose-paper-name">
            {STOCKS.find((option) => option.id === stock)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}
