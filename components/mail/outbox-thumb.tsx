import BoxCover from "@/components/box-cover";
import CoverArt from "@/components/cover-art";
import PaperCutCover from "@/components/paper-cut-cover";
import { isBoxDesign } from "@/lib/box-art/recipes";
import { parseDesign } from "@/lib/design";
import { isPaperCut } from "@/lib/paper-cut";

/** A small cover without the name, for pickers and lists. */
export default function CoverThumb({
  design,
  className = "",
  stockHex,
}: {
  design: string;
  className?: string;
  stockHex?: string;
}) {
  const id = parseDesign(design);
  return (
    <span
      className={`design-thumbnail ${className}`}
      style={stockHex ? { ["--card-stock" as string]: stockHex } : undefined}
      aria-hidden="true"
    >
      {isPaperCut(id) ? (
        <PaperCutCover design={id} compact />
      ) : isBoxDesign(id) ? (
        <BoxCover design={id} compact />
      ) : (
        <CoverArt design={id} />
      )}
    </span>
  );
}
