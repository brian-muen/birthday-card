export const MAX_NOTE_IMAGE_BYTES = 420_000;
export const NOTE_IMAGE_MAX_EDGE = 1200;

const DATA_URL = /^data:(image\/jpeg|image\/png);base64,([A-Za-z0-9+/]+=*)$/;

export function parseNoteImage(
  value: unknown,
): { ok: true; dataUrl: string | null } | { ok: false; error: string } {
  if (value == null || value === "") {
    return { ok: true, dataUrl: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "That photo could not be used. Try a JPG or PNG." };
  }

  const match = value.match(DATA_URL);
  if (!match) {
    return { ok: false, error: "That photo could not be used. Try a JPG or PNG." };
  }

  const bytes = Math.ceil((match[2].length * 3) / 4);
  if (bytes > MAX_NOTE_IMAGE_BYTES) {
    return {
      ok: false,
      error: "That photo is too large. Try another, or a tighter crop.",
    };
  }

  return { ok: true, dataUrl: value };
}
