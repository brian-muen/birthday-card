import { NOTE_IMAGE_MAX_EDGE, parseNoteImage } from "@/lib/note-image";

export async function prepareNoteImage(
  file: File,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return { ok: false, error: "That photo could not be used. Try a JPG or PNG." };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: "That photo could not be used. Try a JPG or PNG." };
  }

  const scale = Math.min(1, NOTE_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return { ok: false, error: "That photo could not be used. Try a JPG or PNG." };
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.56]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const parsed = parseNoteImage(dataUrl);
    if (parsed.ok && parsed.dataUrl) {
      return { ok: true, dataUrl: parsed.dataUrl };
    }
  }

  return {
    ok: false,
    error: "That photo is too large. Try another, or a tighter crop.",
  };
}
