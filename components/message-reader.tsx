import { penClass, penNoteClass, type PenId } from "@/lib/pen";

const LONG_MESSAGE_LENGTH = 520;

/**
 * A small, motion-independent reading surface for long handwritten notes.
 * Native details/summary supplies keyboard and screen-reader disclosure.
 */
export default function MessageReader({
  body,
  authorName,
  pen,
}: {
  body: string;
  authorName: string;
  pen: PenId;
}) {
  const content = (
    <>
      <p className={`whitespace-pre-wrap text-ink font-card ${penNoteClass(pen)}`}>
        {body}
      </p>
      <p className={`mt-6 text-right text-ink font-card ${penClass(pen)}`}>
        {authorName}
      </p>
    </>
  );

  if (body.length <= LONG_MESSAGE_LENGTH) return content;

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[0.9375rem] font-medium text-muted underline decoration-rule decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <span className="group-open:hidden">Read this note</span>
        <span className="hidden group-open:inline">Collapse note</span>
      </summary>
      <div className="mt-5">{content}</div>
    </details>
  );
}
