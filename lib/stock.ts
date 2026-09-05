export const STOCKS = [
  { id: "red", label: "Red", hex: "#e0b3a8" },
  { id: "ivory", label: "Ivory", hex: "#f3efe4" },
  { id: "white", label: "White", hex: "#f7f4ee" },
  { id: "blush", label: "Blush", hex: "#f3e4e0" },
  { id: "sage", label: "Sage", hex: "#e4eae3" },
  { id: "sky", label: "Sky", hex: "#e3e8ef" },
  { id: "butter", label: "Butter", hex: "#f2ecd4" },
] as const;

export type StockId = (typeof STOCKS)[number]["id"];

export const DEFAULT_STOCK: StockId = "red";

export function parseStock(value: unknown): StockId {
  const id = String(value ?? "");
  return STOCKS.some((stock) => stock.id === id) ? (id as StockId) : DEFAULT_STOCK;
}

export function stockHex(value: unknown): string {
  const id = parseStock(value);
  return STOCKS.find((stock) => stock.id === id)?.hex ?? STOCKS[0].hex;
}

export function stockRgb(value: unknown): { r: number; g: number; b: number } {
  const hex = stockHex(value).replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}
