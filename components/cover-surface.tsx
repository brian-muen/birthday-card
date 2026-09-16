import BoxCover from "@/components/box-cover";
import CoverArt from "@/components/cover-art";
import { isBoxDesign } from "@/lib/box-art/recipes";
import { parseDesign } from "@/lib/design";

function nameLength(name: string): "short" | "medium" | "long" {
  if (name.length > 24) return "long";
  if (name.length > 13) return "medium";
  return "short";
}

export default function CoverSurface({
  design,
  recipientName,
}: {
  design: string;
  recipientName: string;
}) {
  const id = parseDesign(design);
  if (isBoxDesign(id)) {
    return <BoxCover design={id} recipientName={recipientName} />;
  }

  const trimmed = recipientName.trim();
  const shown = trimmed || "Name";

  return (
    <span className="card-body card-cover">
      <span className="card-cover-mark" aria-hidden="true" />
      <CoverArt design={id} className="card-cover-art" />
      <span className="card-cover-greeting">Happy birthday</span>
      <span
        className="card-cover-name"
        data-length={nameLength(shown)}
        data-empty={trimmed ? undefined : "true"}
      >
        {shown}
      </span>
    </span>
  );
}
