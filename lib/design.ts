export const DESIGNS = [
  { id: "cake", label: "Birthday cake" },
  { id: "balloons", label: "Balloons" },
  { id: "flowers", label: "Flowers" },
  { id: "plain", label: "Just words" },
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];
// Older cards keep their original cover.
export function parseDesign(value: unknown): DesignId {
  return DESIGNS.some((design) => design.id === value) ? value as DesignId : "plain";
}

type Shape = { d: string; fill?: string; stroke?: string };
const ink = "#594b55";
// Shared vector artwork keeps the screen and PDF illustrations identical.
export const DESIGN_ART: Record<DesignId, Shape[]> = {
  plain: [],
  cake: [
    { d: "M29 129 Q80 139 131 129 L131 133 Q80 143 29 133 Z", fill: "#abb7a1" },
    { d: "M39 81 Q80 73 121 81 L121 125 Q80 136 39 125 Z", fill: "#f6e7ce", stroke: ink },
    { d: "M40 106 Q80 114 120 106", stroke: "#c48383" },
    { d: "M39 81 Q80 70 121 81 L121 93 Q111 105 105 94 Q98 86 92 98 Q84 110 77 97 Q71 88 65 99 Q53 110 48 95 Q42 90 39 94 Z", fill: "#fffaf0", stroke: ink },
    { d: "M54 78 L54 53 L60 53 L60 77 M77 76 L77 46 L83 46 L83 76 M100 77 L100 53 L106 53 L106 78", fill: "#c48383", stroke: ink },
    { d: "M57 48 C46 43 58 34 57 31 C69 43 61 48 57 48 M80 41 C69 36 81 27 80 24 C92 36 84 41 80 41 M103 48 C92 43 104 34 103 31 C115 43 107 48 103 48", fill: "#d6a146" },
    { d: "M23 69 L28 73 M132 58 L136 52 M24 109 L19 112 M136 109 L142 111", stroke: "#b98180" },
  ],
  balloons: [
    { d: "M49 79 C41 99 72 111 71 142 M107 78 C120 103 77 117 85 144 M79 64 C65 91 91 116 79 146", stroke: ink },
    { d: "M50 21 C18 21 18 67 49 79 C78 68 80 22 50 21 Z", fill: "#b8c6ad", stroke: ink },
    { d: "M109 21 C78 21 78 66 108 78 C138 66 139 22 109 21 Z", fill: "#d49a91", stroke: ink },
    { d: "M79 7 C49 7 48 51 79 65 C110 52 110 7 79 7 Z", fill: "#e6c778", stroke: ink },
    { d: "M47 80 L44 86 L54 86 Z M105 80 L103 86 L113 86 Z M77 66 L74 72 L84 72 Z", fill: ink },
    { d: "M36 36 Q32 42 34 48 M67 20 Q62 26 64 32 M97 34 Q93 40 95 46", stroke: "#fffaf0" },
  ],
  flowers: [
    { d: "M80 139 Q80 95 79 53 M80 139 Q65 102 43 78 M80 139 Q98 99 119 74", stroke: "#71866a" },
    { d: "M79 115 Q53 120 54 100 Q75 99 79 115 M88 113 Q109 114 108 96 Q91 97 88 113", fill: "#a7b499", stroke: "#71866a" },
    { d: "M79 40 C62 14 45 42 64 51 C41 67 64 85 78 64 C93 86 116 65 95 52 C114 31 91 19 79 40 Z", fill: "#dba8a0", stroke: ink },
    { d: "M43 69 C29 48 13 71 29 80 C12 95 36 108 44 90 C59 104 76 83 56 78 C67 58 46 53 43 69 Z", fill: "#e6ca8a", stroke: ink },
    { d: "M119 62 C107 45 93 63 106 74 C92 90 115 101 121 83 C139 96 151 73 132 70 C142 49 122 47 119 62 Z", fill: "#eee6d4", stroke: ink },
    { d: "M86 52 A7 7 0 1 1 72 52 A7 7 0 1 1 86 52 M49 80 A6 6 0 1 1 37 80 A6 6 0 1 1 49 80 M126 74 A6 6 0 1 1 114 74 A6 6 0 1 1 126 74", fill: "#b48745" },
    { d: "M68 127 Q80 137 91 125 M79 132 Q60 117 64 135 Q69 142 79 132 Q96 117 96 135 Q90 144 79 132", stroke: "#b98180" },
  ],
};
