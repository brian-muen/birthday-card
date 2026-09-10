import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type CjkFaceId = "kr" | "sc" | "tc";

const FILES: Record<CjkFaceId, { file: string; url: string }> = {
  kr: {
    file: "NotoSansKR-Regular.otf",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf",
  },
  sc: {
    file: "NotoSansSC-Regular.otf",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  },
  tc: {
    file: "NotoSansTC-Regular.otf",
    url: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC/NotoSansTC-Regular.otf",
  },
};

const memory = new Map<CjkFaceId, Uint8Array>();

export async function loadCjkFont(id: CjkFaceId): Promise<Uint8Array> {
  const cached = memory.get(id);
  if (cached) return cached;

  const { file, url } = FILES[id];
  const bundled = path.join(process.cwd(), "lib/fonts", file);
  try {
    const bytes = await readFile(bundled);
    memory.set(id, bytes);
    return bytes;
  } catch {
    // Not checked in — fetch once and keep it in /tmp for this machine.
  }

  const temp = path.join(tmpdir(), "bday-card-fonts", file);
  try {
    const bytes = await readFile(temp);
    memory.set(id, bytes);
    return bytes;
  } catch {
    // First PDF that needs this face.
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${file}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  memory.set(id, bytes);
  try {
    await mkdir(path.dirname(temp), { recursive: true });
    await writeFile(temp, bytes);
  } catch {
    // Cache is best-effort.
  }
  return bytes;
}
