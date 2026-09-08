import { penNoteClass, penSignatureClass, type PenId } from "@/lib/pen";

const LONG_MESSAGE_LENGTH = 520;

function splitNote(body: string, limit: number) {
  if (body.length <= limit) {
    return { opening: body, rest: "" };
  }

  const window = body.slice(0, limit);
  const breakAt = Math.max(
    window.lastIndexOf("\n"),
    window.lastIndexOf(" "),
    window.lastIndexOf("\u00a0"),
  );
  const index = breakAt >= Math.floor(limit * 0.55) ? breakAt : limit;
  const opening = body.slice(0, index).trimEnd();
  const rest = body.slice(index).trimStart();
  return rest ? { opening, rest } : { opening: body, rest: "" };
}

/**
 * A small, motion-independent reading surface for handwritten notes.
 * Long notes keep the written opening on the card; native details discloses the rest.
 */
export default function MessageReader({
  body,
  authorName,
  pen,
  expandAfter = LONG_MESSAGE_LENGTH,
}: {
  body: string;
  authorName: string;
  pen: PenId;
  expandAfter?: number;
}) {
  const { opening, rest } = splitNote(body, expandAfter);
  const noteClass = `whitespace-pre-wrap font-card ${penNoteClass(pen)}`;

  return (
    <div className="has-[details[open]]:[&_.note-ellipsis]:hidden">
      <p className={noteClass}>
        {opening}
        {rest ? (
          <span className="note-ellipsis" aria-hidden="true">
            …
          </span>
        ) : null}
      </p>
      {rest ? (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-[0.8125rem] font-medium text-muted underline decoration-rule decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::marker]:content-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Continue this note</span>
            <span className="hidden group-open:inline">Show less of this note</span>
          </summary>
          <p className={`mt-3 ${noteClass}`}>{rest}</p>
        </details>
      ) : null}
      <p className={`mt-6 text-right font-card ${penSignatureClass(pen)}`}>
        {authorName}
      </p>
    </div>
  );
}
