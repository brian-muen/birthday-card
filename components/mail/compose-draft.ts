import { parseDesign, type DesignId } from "@/lib/design";
import { parseStock, type StockId } from "@/lib/stock";

const KEY = "birthday-mail:compose-draft";

export type ComposeDraft = {
  name: string;
  birthday: string;
  intro: string;
  stock: StockId;
  design: DesignId;
};

/** Holds a signed-out draft across the Google sign-in round trip. */
export function saveComposeDraft(draft: ComposeDraft) {
  try {
    if (!draft.name && !draft.intro && !draft.birthday) {
      window.sessionStorage.removeItem(KEY);
      return;
    }
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private mode or blocked storage only costs the draft.
  }
}

/** Reads the saved draft once and forgets it. */
export function takeComposeDraft(): ComposeDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<Record<keyof ComposeDraft, unknown>>;
    const name = typeof draft.name === "string" ? draft.name : "";
    const birthday = typeof draft.birthday === "string" ? draft.birthday : "";
    const intro = typeof draft.intro === "string" ? draft.intro : "";
    if (!name && !intro && !birthday) return null;
    return {
      name,
      birthday,
      intro,
      stock: parseStock(draft.stock),
      design: parseDesign(draft.design),
    };
  } catch {
    return null;
  }
}
