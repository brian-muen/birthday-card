import CoverSurface from "@/components/cover-surface";

/** The front of the card, sitting still. No turn, no scrubber. */
export default function StillCover({
  name,
  design,
}: {
  name: string;
  design: string;
}) {
  const label = name.trim() ? `${name.trim()}’s card` : "The card";
  return (
    <div className="still-cover" role="img" aria-label={label}>
      <CoverSurface design={design} recipientName={name} />
    </div>
  );
}
