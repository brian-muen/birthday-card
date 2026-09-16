export const DEFAULT_DEDICATION = "From your brothers and sisters in Christ";
export const DEDICATION_MAX = 160;

/** Cards created before this field existed have no stored value. */
export function resolveDedication(value: string | null | undefined): string {
  if (value == null) return DEFAULT_DEDICATION;
  return value.trim();
}
