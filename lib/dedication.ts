const RETIRED_DEFAULT = "From your brothers and sisters in Christ";

export function resolveDedication(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text || text === RETIRED_DEFAULT) return "";
  return text;
}
