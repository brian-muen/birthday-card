const FALLBACK = "/cards";

/** Allow only in-app relative paths so auth redirects cannot leave the site. */
export function safeNextPath(raw: unknown): string {
  if (typeof raw !== "string") return FALLBACK;
  const path = raw.trim();
  if (!path.startsWith("/")) return FALLBACK;
  if (path.startsWith("//") || path.includes("\\") || path.includes("://")) {
    return FALLBACK;
  }
  if (path.includes("\n") || path.includes("\r") || path.includes("\0")) {
    return FALLBACK;
  }
  return path;
}

export function createdMasterToken(path: string): string | null {
  const match = /^\/created\/([23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{24})$/.exec(
    path,
  );
  return match?.[1] ?? null;
}
