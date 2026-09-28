const GREETING = /^(happy\s+(birthday|bday|b-day)|hbd|dear|hi|hey|hello|hiya)\b/i;
const SUBJECT_MAX = 48;
const PREVIEW_MAX = 160;

function sentencesOf(body: string) {
  return body
    .split(/\n+/)
    .flatMap((line) => line.trim().split(/(?<=[.!?。！？…])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isOpener(sentence: string) {
  const words = sentence.replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim().split(/\s+/);
  if (/^[^\s]+,$/.test(sentence)) return true;
  return words.length <= 4 && GREETING.test(sentence);
}

function clip(text: string, max: number) {
  const chars = Array.from(text);
  if (chars.length <= max) return text.replace(/[.,;:]+$/, "");
  const cut = chars.slice(0, max).join("");
  const space = cut.lastIndexOf(" ");
  const trimmed = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${trimmed.replace(/[\s.,;:!?-]+$/, "")}…`;
}

/**
 * A subject line that reads like email: the first real sentence, clipped.
 * A bare "Happy birthday!" opener is skipped when something follows it,
 * so a stack of birthday notes doesn't show one subject over and over.
 */
export function subjectFor(body: string) {
  const sentences = sentencesOf(body);
  if (sentences.length === 0) return "(No subject)";
  const pick =
    sentences.length > 1 && isOpener(sentences[0]) ? sentences[1] : sentences[0];
  return clip(pick, SUBJECT_MAX);
}

export function previewFor(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  return chars.length <= PREVIEW_MAX
    ? text
    : `${chars.slice(0, PREVIEW_MAX).join("").trimEnd()}…`;
}
