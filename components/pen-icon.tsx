import type { PenId } from "@/lib/pen";

export function PenIcon({ id }: { id: PenId }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "size-6",
  };

  switch (id) {
    case "fountain":
      return (
        <svg {...common}>
          <path d="M12 3.2 15.6 12H8.4L12 3.2Z" />
          <path d="M8.4 12h7.2L14.2 20.2a2.4 2.4 0 0 1-4.4 0L8.4 12Z" />
          <path d="M12 12v6.4" />
        </svg>
      );
    case "marker":
      return (
        <svg {...common}>
          <path d="M8.2 3.4h7.6v11.2H8.2z" />
          <path d="M8.2 14.6 9.4 20.6h5.2l1.2-6" />
          <path d="M8.2 6.2h7.6" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...common}>
          <path d="M8.4 3.4h7.2v12.2L12 20.6 8.4 15.6V3.4Z" />
          <path d="M8.4 6h7.2" />
          <path d="M8.4 15.6h7.2" />
          <path d="M12 15.6v5" />
        </svg>
      );
    case "ballpoint":
      return (
        <svg {...common}>
          <path d="M10.6 2.6h2.8v2.2h-2.8z" />
          <path d="M10.2 4.8h3.6v11.4H10.2z" />
          <path d="M10.2 16.2 12 21.2l1.8-5" />
        </svg>
      );
    case "brush":
      return (
        <svg {...common}>
          <path d="M10.6 2.8h2.8v8.4h-2.8z" />
          <path d="M8.4 11.2h7.2s.8 2.4.8 4.2c0 2.4-2.2 4-4.4 4s-4.4-1.6-4.4-4c0-1.8.8-4.2.8-4.2Z" />
        </svg>
      );
  }
}
