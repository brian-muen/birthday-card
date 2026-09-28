// Draws the desktop's 1-bit cursors into public/cursors/*.svg. Edit the pixel
// art below, then run:
//
//   node scripts/cursors.mjs
//
// `#` is ink, `.` is white, a space is clear. `halo` rings the ink in one
// pixel of white so black-on-clear cursors stay visible on dark paper.
// Hotspots live in app/cursors.css and are counted on the finished image,
// halo included.

import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#1f1b2e";
const WHITE = "#ffffff";

const cursors = {
  arrow: {
    halo: true,
    art: [
      "#        ",
      "##       ",
      "###      ",
      "####     ",
      "#####    ",
      "######   ",
      "#######  ",
      "######## ",
      "#########",
      "######   ",
      "### ##   ",
      "##  ##   ",
      "#    ##  ",
      "     ##  ",
      "      ## ",
      "      ## ",
    ],
  },
  hand: {
    art: [
      "     ##         ",
      "    #..#        ",
      "    #..#        ",
      "    #..#        ",
      "    #..###      ",
      "    #..#..###   ",
      "    #..#..#..## ",
      " ## #..#..#..#.#",
      "#..##........#.#",
      "#...#..........#",
      " #.............#",
      "  #............#",
      "  #...........# ",
      "   #..........# ",
      "    #........#  ",
      "    #........#  ",
      "    ##########  ",
    ],
  },
  grab: {
    art: [
      "       ## ##    ",
      "    ###..#..#   ",
      "   #..#..#..##  ",
      "   #..#..#..#.# ",
      "   #..#..#..#.# ",
      "   #..#..#..#.# ",
      "   #..#..#..#.# ",
      " ###..#..#..#.# ",
      "#..#..........# ",
      "#.............# ",
      " #............# ",
      "  #..........#  ",
      "   #.........#  ",
      "    #.......#   ",
      "    #.......#   ",
      "    #########   ",
    ],
  },
  grabbing: {
    art: [
      "                ",
      "                ",
      "                ",
      "                ",
      "                ",
      "    ## ## ##    ",
      "   #..#..#..##  ",
      " ###..#..#..#.# ",
      "#..#..........# ",
      "#.............# ",
      " #............# ",
      "  #..........#  ",
      "   #.........#  ",
      "    #.......#   ",
      "    #.......#   ",
      "    #########   ",
    ],
  },
  text: {
    halo: true,
    art: [
      "##   ##",
      "  # #  ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "   #   ",
      "  # #  ",
      "##   ##",
    ],
  },
  busy: {
    halo: true,
    art: [
      "   #####    ",
      "   #####    ",
      "  #######   ",
      " #.......#  ",
      "#....#....# ",
      "#....#....# ",
      "#....#....##",
      "#....###..##",
      "#.........# ",
      "#.........# ",
      " #.......#  ",
      "  #######   ",
      "   #####    ",
      "   #####    ",
    ],
  },
};

function withHalo(art) {
  const width = art[0].length + 2;
  const grid = Array.from({ length: art.length + 2 }, (_, y) =>
    Array.from({ length: width }, (_, x) => art[y - 1]?.[x - 1] ?? " "),
  );
  const ink = (x, y) => grid[y]?.[x] === "#";
  return grid.map((row, y) =>
    row
      .map((cell, x) => {
        if (cell !== " ") return cell;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) if (ink(x + dx, y + dy)) return ".";
        }
        return " ";
      })
      .join(""),
  );
}

// One run of same-colored pixels per rect, so each color is a single path.
function path(rows, char) {
  let d = "";
  rows.forEach((row, y) => {
    for (const match of row.matchAll(new RegExp(`\\${char}+`, "g"))) {
      d += `M${match.index} ${y}h${match[0].length}v1h-${match[0].length}z`;
    }
  });
  return d;
}

function svg(rows) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`,
    `<path fill="${WHITE}" d="${path(rows, ".")}"/>`,
    `<path fill="${INK}" d="${path(rows, "#")}"/>`,
    `</svg>`,
    "",
  ].join("\n");
}

const out = new URL("../public/cursors/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, { art, halo }] of Object.entries(cursors)) {
  const rows = halo ? withHalo(art) : art;
  writeFileSync(new URL(`${name}.svg`, out), svg(rows));
  console.log(`${name}.svg ${rows[0].length}x${rows.length}`);
}
