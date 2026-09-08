import { DESIGN_ART, parseDesign } from "@/lib/design";

export default function CoverArt({ design, className = "" }: { design: string; className?: string }) {
  const shapes = DESIGN_ART[parseDesign(design)];
  if (!shapes.length) return null;
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true" fill="none">
      {shapes.map((shape, index) => (
        <path key={index} d={shape.d} fill={shape.fill ?? "none"} stroke={shape.stroke}
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
