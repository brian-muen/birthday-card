const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;
// Room for a belated card, but a birth year typed in by mistake is rejected.
const EARLIEST_DAYS_AGO = 60;
const LATEST_DAYS_AHEAD = 366;

export const BIRTHDAY_RANGE_ERROR = "Pick the birthday coming up, within the next year.";

const longFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const shortFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Midnight UTC of a YYYY-MM-DD calendar day, or null if it isn't a real day. */
function dayStart(iso: string) {
  const match = ISO_DAY.exec(iso);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return time;
}

function today(now: Date) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function parseBirthday(
  value: FormDataEntryValue | null,
  now = new Date(),
): { ok: true; birthday: string | null } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { ok: true, birthday: null };
  const time = dayStart(raw);
  if (time == null) return { ok: false, error: "That birthday isn’t a real date." };
  const offset = (time - today(now)) / DAY_MS;
  if (offset < -EARLIEST_DAYS_AGO || offset > LATEST_DAYS_AHEAD) {
    return { ok: false, error: BIRTHDAY_RANGE_ERROR };
  }
  return { ok: true, birthday: raw };
}

/** Whether this calendar day can be stored as the card's birthday. */
export function birthdayAllowed(iso: string, now = new Date()) {
  const parsed = parseBirthday(iso, now);
  return parsed.ok && parsed.birthday !== null;
}

/** "Friday, Oct 3", or "Oct 3" when short. Invalid input formats as "". */
export function formatBirthday(iso: string, style: "long" | "short" = "long") {
  const time = dayStart(iso);
  if (time == null) return "";
  return (style === "long" ? longFormat : shortFormat).format(time);
}

/** The birthday itself, as "Friday, Oct 3". Signers are asked to sign by this day. */
export function signByDay(iso: string) {
  return formatBirthday(iso);
}

export type BirthdayTiming = {
  day: string;
  /** "Oct 3", for a subject line. */
  short: string;
  /** The birthday, while that day is still ahead. */
  signBy: string | null;
  when: "upcoming" | "today" | "past";
};

export function birthdayTiming(iso: string, now = new Date()): BirthdayTiming | null {
  const time = dayStart(iso);
  if (time == null) return null;
  const offset = (time - today(now)) / DAY_MS;
  return {
    day: longFormat.format(time),
    short: shortFormat.format(time),
    signBy: offset > 0 ? signByDay(iso) : null,
    when: offset > 0 ? "upcoming" : offset === 0 ? "today" : "past",
  };
}
