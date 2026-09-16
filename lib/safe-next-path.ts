const FALLBACK = "/cards";
const APP_ORIGIN = "https://birthday-card.invalid";

function decodePath(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/** Allow only in-app relative paths so auth redirects cannot leave the site. */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return FALLBACK;
  const decoded = decodePath(raw.trim());
  if (decoded == null) return FALLBACK;
  if (/[\u0000-\u001F\u007F]/.test(decoded) || decoded.includes("\\")) {
    return FALLBACK;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return FALLBACK;

  let url: URL;
  try {
    url = new URL(decoded, APP_ORIGIN);
  } catch {
    return FALLBACK;
  }
  if (url.origin !== APP_ORIGIN || url.protocol !== "https:") return FALLBACK;
  if (url.username || url.password) return FALLBACK;
  if (url.pathname.includes("//")) return FALLBACK;

  const next = `${url.pathname}${url.search}`;
  if (!next.startsWith("/") || next.startsWith("//")) return FALLBACK;
  if (next === "/account" || next.startsWith("/account?")) return FALLBACK;
  return next;
}

export function createdMasterToken(path: string): string | null {
  const match = /^\/created\/([23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{24})$/.exec(
    path,
  );
  return match?.[1] ?? null;
}
