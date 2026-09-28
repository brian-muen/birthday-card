import { useId } from "react";

import { CUT_H, CUT_W, layerDepth, paperCut, type PaperCutId } from "@/lib/paper-cut";

function nameLength(name: string): "short" | "medium" | "long" {
  if (name.length > 24) return "long";
  if (name.length > 12) return "medium";
  return "short";
}

/** A cast shadow below each sheet, and a lit top rim where the cut edge catches light. */
function Lift({ id, blur, drop, shade }: { id: string; blur: number; drop: number; shade: number }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="125%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="blur" />
      <feOffset in="blur" dy={drop} result="drop" />
      <feFlood floodColor="#1a1015" floodOpacity={shade} />
      <feComposite in2="drop" operator="in" result="shadow" />
      <feGaussianBlur in="SourceAlpha" stdDeviation={blur * 0.3} result="tight" />
      <feOffset in="tight" dy={drop * 0.35} result="tightDrop" />
      <feFlood floodColor="#1a1015" floodOpacity={Math.min(0.5, shade * 1.1)} />
      <feComposite in2="tightDrop" operator="in" result="contact" />
      <feOffset in="SourceAlpha" dy="0.45" result="down" />
      <feComposite in="SourceAlpha" in2="down" operator="out" result="rimMask" />
      <feFlood floodColor="#ffffff" floodOpacity="0.42" />
      <feComposite in2="rimMask" operator="in" result="rim" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="contact" />
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="rim" />
      </feMerge>
    </filter>
  );
}

export default function PaperCutCover({
  design,
  recipientName = "",
  compact = false,
}: {
  design: PaperCutId;
  recipientName?: string;
  compact?: boolean;
}) {
  const art = paperCut(design);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const name = recipientName.trim();
  const shown = name || "Their name";
  const front = art.layers.length - 1;

  return (
    <span
      className="card-body cut-cover"
      data-design={design}
      data-compact={compact ? "true" : undefined}
      style={{ ["--cut-text" as string]: art.text }}
    >
      {art.layers.map((layer, index) => {
        const filter = index === 0 ? undefined : `${uid}-${layer.frame ? "front" : "lift"}-${index}`;
        return (
          <svg
            key={index}
            className="cut-layer"
            viewBox={`0 0 ${CUT_W} ${CUT_H}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={{ ["--depth" as string]: layerDepth(art, index) }}
            data-front={index === front ? "true" : undefined}
          >
            {filter ? (
              <defs>
                {layer.frame ? (
                  <Lift id={filter} blur={index === front ? 1.9 : 1.1} drop={index === front ? 2 : 1.2} shade={index === front ? 0.5 : 0.4} />
                ) : (
                  <Lift id={filter} blur={1} drop={1.1} shade={0.36} />
                )}
              </defs>
            ) : null}
            <g filter={filter ? `url(#${filter})` : undefined}>
              {layer.shapes.map((shape, shapeIndex) => (
                <path key={shapeIndex} d={shape.d} fill={shape.fill} />
              ))}
            </g>
          </svg>
        );
      })}
      {compact ? null : (
        <span className="cut-type">
          <span className="cut-greeting">Happy birthday</span>
          <span className="cut-name" data-length={nameLength(shown)} data-empty={name ? undefined : "true"}>
            {shown}
          </span>
        </span>
      )}
    </span>
  );
}
