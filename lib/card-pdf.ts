import fontkit from "@pdf-lib/fontkit";
import type { Font as FkFont } from "@pdf-lib/fontkit";
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parsePen, penFile, penPdfSize, type PenId } from "@/lib/pen";
import { stockRgb } from "@/lib/stock";
import { DESIGN_ART, parseDesign } from "@/lib/design";

const INK = rgb(0.106, 0.141, 0.251); // --ink #1b2440
const INK_PEN = rgb(0.165, 0.137, 0.11); // --ink-pen #2a231c
const LINER = rgb(1, 253 / 255, 248 / 255); // --paper-liner #fffdf8

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 595;
const MARGIN_X = 56;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const BODY_SIZE = 12;
const BODY_LINE_HEIGHT = 19;
const CONTENT_TOP = PAGE_HEIGHT - 84;
const CONTENT_BOTTOM = 112;
const CLIP_X = 22;
const CLIP_Y = 22;
const CLIP_WIDTH = PAGE_WIDTH - 44;
const CLIP_HEIGHT = PAGE_HEIGHT - 44;

const DEDICATION = "From your brothers and sisters in Christ";

// Keep kerning, drop ligatures so one PDF draw matches one shaped glyph.
const LAYOUT_FEATURES = {
  liga: false,
  dlig: false,
  hlig: false,
  clig: false,
  calt: false,
} as const;

type Face = {
  pdf: PDFFont;
  fk?: FkFont;
};

export type PdfNote = {
  authorName: string;
  body: string;
  date: string;
  pen: PenId;
};

export async function buildCardPdf(input: {
  recipientName: string;
  intro: string | null;
  stock: string;
  design?: string;
  showCount: boolean;
  notes: PdfNote[];
}) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Happy Birthday, ${input.recipientName}`);
  doc.registerFontkit(fontkit);

  const printed = await embedFace(doc, "cormorant.ttf");
  const printedItalic = await embedFace(doc, "cormorant-italic.ttf");
  const sans: Face = { pdf: await doc.embedFont(StandardFonts.Helvetica) };

  const pens = new Map<PenId, Face>();
  for (const note of input.notes) {
    const pen = parsePen(note.pen);
    if (!pens.has(pen)) {
      pens.set(pen, await embedFace(doc, penFile(pen)));
    }
  }

  const sanitizePrinted = makeSanitizer(printed.pdf);
  const paper = (() => {
    const { r, g, b } = stockRgb(input.stock);
    return rgb(r, g, b);
  })();

  drawCoverPage(doc, {
    design: input.design,
    printed,
    printedItalic,
    paper,
    recipientName: sanitizePrinted(input.recipientName),
  });

  drawDedicationPage(doc, {
    printedItalic,
    dedication: DEDICATION,
  });

  input.notes.forEach((note, i) => {
    const pen = parsePen(note.pen);
    const writing = pens.get(pen);
    if (!writing) return;
    const sanitize = makeSanitizer(writing.pdf);
    const bodySize = penPdfSize(pen);
    drawMessagePages(doc, {
      writing,
      sans,
      paper: LINER,
      body: sanitize(note.body),
      authorName: sanitize(note.authorName),
      date: note.date,
      pageNumber: i + 1,
      pageTotal: input.notes.length,
      showIndex: input.showCount,
      bodySize,
      bodyLineHeight: Math.round(bodySize * 1.75),
      wrapFactor: wrapFactorFor(pen),
    });
  });

  return doc.save();
}

async function embedFace(doc: PDFDocument, file: string): Promise<Face> {
  const bytes = await readFile(path.join(process.cwd(), "lib/fonts", file));
  // Keep the full face. Subsetting remaps glyphs and drops kerning.
  const pdf = await doc.embedFont(bytes, { subset: false });
  return { pdf, fk: fontkit.create(bytes) };
}

function wrapFactorFor(pen: PenId) {
  switch (pen) {
    case "fountain":
    case "brush":
      return 0.84;
    case "marker":
    case "pencil":
      return 0.92;
    default:
      return 0.98;
  }
}

function addPage(
  doc: PDFDocument,
  paper: ReturnType<typeof rgb>,
  options?: { boundEdge?: boolean },
): PDFPage {
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: paper,
  });

  page.drawRectangle({
    x: 14,
    y: 14,
    width: PAGE_WIDTH - 28,
    height: PAGE_HEIGHT - 28,
    borderColor: INK,
    borderOpacity: 0.15,
    borderWidth: 0.75,
  });

  if (options?.boundEdge !== false) {
    page.drawLine({
      start: { x: 34, y: 44 },
      end: { x: 34, y: PAGE_HEIGHT - 44 },
      color: INK,
      opacity: 0.08,
      thickness: 0.75,
    });
  }

  return page;
}

function drawCoverPage(
  doc: PDFDocument,
  input: {
    design?: string;
    printed: Face;
    printedItalic: Face;
    paper: ReturnType<typeof rgb>;
    recipientName: string;
  },
) {
  const page = addPage(doc, input.paper, { boundEdge: false });

  const greeting = "Happy birthday";
  const greetingSize = fitSize(
    greeting,
    input.printedItalic,
    15,
    TEXT_WIDTH,
    0.98,
  );
  const name = input.recipientName.trim() || " ";
  const nameLayout = layoutFittedText(
    name,
    input.printed,
    coverNameSize(name),
    TEXT_WIDTH,
    {
      minSize: 11,
      maxLines: name.length > 40 ? 4 : 3,
      factor: 0.98,
    },
  );

  const greetingHeight = greetingSize * 1.3;
  const nameHeight = nameLayout.lines.length * nameLayout.lineHeight;
  const shapes = DESIGN_ART[parseDesign(input.design)];
  const artHeight = shapes.length ? 150 : 0;
  const blockHeight = artHeight + greetingHeight + 8 + nameHeight;
  let y = (PAGE_HEIGHT + blockHeight) / 2;

  const artColor = (hex: string) => rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
  for (const shape of shapes) {
    page.drawSvgPath(shape.d, {
      x: PAGE_WIDTH / 2 - 64,
      y,
      scale: 0.8,
      color: shape.fill ? artColor(shape.fill) : undefined,
      borderColor: shape.stroke ? artColor(shape.stroke) : undefined,
      borderWidth: shape.stroke ? 1.36 : 0,
    });
  }
  y -= artHeight;

  y -= greetingHeight;
  drawCentered(page, greeting, {
    face: input.printedItalic,
    size: greetingSize,
    y,
    color: INK_PEN,
    opacity: 0.78,
  });
  y -= 8;

  for (const line of nameLayout.lines) {
    y -= nameLayout.lineHeight;
    drawCentered(page, line, {
      face: input.printed,
      size: nameLayout.size,
      y,
      color: INK_PEN,
    });
  }
}

function drawDedicationPage(
  doc: PDFDocument,
  input: {
    printedItalic: Face;
    dedication: string;
  },
) {
  const page = addPage(doc, LINER);
  const size = 16;
  const column = Math.min(TEXT_WIDTH, 200);
  const lines = wrapText(input.dedication, input.printedItalic, size, column, 0.98);
  const lineHeight = size * 1.5;
  let y = (PAGE_HEIGHT + lines.length * lineHeight) / 2;

  for (const line of lines) {
    y -= lineHeight;
    drawCentered(page, line, {
      face: input.printedItalic,
      size,
      y,
      color: INK_PEN,
      opacity: 0.88,
    });
  }
}

function drawMessagePages(
  doc: PDFDocument,
  input: {
    writing: Face;
    sans: Face;
    paper: ReturnType<typeof rgb>;
    body: string;
    authorName: string;
    date: string;
    pageNumber: number;
    pageTotal: number;
    showIndex: boolean;
    bodySize: number;
    bodyLineHeight: number;
    wrapFactor: number;
  },
) {
  const bodySize = input.bodySize || BODY_SIZE;
  const bodyLineHeight = input.bodyLineHeight || BODY_LINE_HEIGHT;
  const lines = wrapText(
    input.body,
    input.writing,
    bodySize,
    TEXT_WIDTH,
    input.wrapFactor,
  );

  const signature = layoutFittedText(
    input.authorName.trim() ? `- ${input.authorName.trim()}` : "",
    input.writing,
    Math.max(11, bodySize),
    TEXT_WIDTH,
    { minSize: 8, maxLines: 2, factor: input.wrapFactor },
  );
  const footerHeight =
    28 + signature.lines.length * signature.lineHeight + (input.date ? 14 : 0);
  const lastBottom = Math.max(CONTENT_BOTTOM, 36 + footerHeight);
  const continuedBottom = 64;
  const lastMax = linesPerPage(bodyLineHeight, lastBottom);
  const continuedMax = linesPerPage(bodyLineHeight, continuedBottom);

  const chunks: string[][] = [];
  let offset = 0;
  while (offset < lines.length || chunks.length === 0) {
    const remaining = lines.length - offset;
    if (remaining <= lastMax) {
      chunks.push(lines.slice(offset));
      break;
    }
    chunks.push(lines.slice(offset, offset + continuedMax));
    offset += continuedMax;
    if (offset >= lines.length) break;
  }

  chunks.forEach((chunk, chunkIndex) => {
    const page = addPage(doc, input.paper);
    const isLastChunk = chunkIndex === chunks.length - 1;
    const bottom = isLastChunk ? lastBottom : continuedBottom;

    if (input.showIndex) {
      const header =
        chunks.length > 1 && chunkIndex > 0
          ? `${input.pageNumber} of ${input.pageTotal}, continued`
          : `${input.pageNumber} of ${input.pageTotal}`;
      drawCentered(page, header, {
        face: input.sans,
        size: 9,
        y: PAGE_HEIGHT - 56,
        color: INK,
        opacity: 0.35,
      });
    }

    const blockHeight = chunk.length * bodyLineHeight;
    const top = CONTENT_TOP;
    let y =
      chunks.length === 1
        ? bottom + (top - bottom + blockHeight) / 2 - bodyLineHeight
        : top - bodyLineHeight;

    withTextClip(page, () => {
      for (const line of chunk) {
        if (line) {
          const fitted = fitSize(
            line,
            input.writing,
            bodySize,
            TEXT_WIDTH,
            input.wrapFactor,
          );
          drawLine(page, line, {
            face: input.writing,
            x: MARGIN_X,
            y,
            size: fitted,
            color: INK_PEN,
            opacity: 0.9,
          });
        }
        y -= bodyLineHeight;
      }
    });

    if (isLastChunk) {
      let footY = 48;
      if (input.date && input.showIndex) {
        drawRight(page, input.date, {
          face: input.sans,
          size: 7.5,
          y: footY,
          color: INK,
          opacity: 0.4,
        });
        footY += 14;
      }

      withTextClip(page, () => {
        let sigY = footY + (signature.lines.length - 1) * signature.lineHeight;
        for (const line of signature.lines) {
          drawRight(page, line, {
            face: input.writing,
            size: signature.size,
            y: sigY,
            color: INK_PEN,
          });
          sigY -= signature.lineHeight;
        }
      });
    }
  });
}

function coverNameSize(name: string) {
  if (name.length > 24) return 18;
  if (name.length > 13) return 24;
  return 32;
}

function linesPerPage(lineHeight: number, bottom: number) {
  return Math.max(1, Math.floor((CONTENT_TOP - bottom) / lineHeight));
}

function layoutFittedText(
  text: string,
  face: Face,
  preferred: number,
  maxWidth: number,
  options: { minSize: number; maxLines: number; factor: number },
) {
  if (!text) {
    return { lines: [] as string[], size: preferred, lineHeight: preferred * 1.2 };
  }

  for (let size = preferred; size >= options.minSize; size -= 0.5) {
    const lines = wrapText(text, face, size, maxWidth, options.factor);
    if (lines.length <= options.maxLines) {
      return { lines, size, lineHeight: size * 1.2 };
    }
  }

  return {
    lines: wrapText(text, face, options.minSize, maxWidth, options.factor),
    size: options.minSize,
    lineHeight: options.minSize * 1.2,
  };
}

function fitSize(
  text: string,
  face: Face,
  preferred: number,
  maxWidth: number,
  factor: number,
) {
  let size = preferred;
  while (size > 7 && measure(face, text, size) / factor > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function measure(face: Face, text: string, size: number) {
  if (!text) return 0;
  if (face.fk) {
    const run = face.fk.layout(text, LAYOUT_FEATURES);
    const scale = size / face.fk.unitsPerEm;
    return run.positions.reduce((sum, pos) => sum + pos.xAdvance * scale, 0);
  }
  return face.pdf.widthOfTextAtSize(text, size);
}

function makeSanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet());
  return (text: string) =>
    Array.from(text.replace(/\r\n?/g, "\n").replace(/\t/g, "  "))
      .map((ch) => {
        if (ch === "\n") return ch;
        return supported.has(ch.codePointAt(0)!) ? ch : "";
      })
      .join("");
}

function wrapText(
  text: string,
  face: Face,
  size: number,
  maxWidth: number,
  factor: number,
): string[] {
  const lines: string[] = [];
  const limit = maxWidth * factor;

  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/[ ]+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(face, candidate, size) <= limit) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);

      let rest = word;
      while (rest.length > 1 && measure(face, rest, size) > limit) {
        let i = 1;
        while (
          i < rest.length &&
          measure(face, rest.slice(0, i + 1), size) <= limit
        ) {
          i += 1;
        }
        lines.push(rest.slice(0, i));
        rest = rest.slice(i);
      }
      current = rest;
    }
    if (current) lines.push(current);
  }

  return lines;
}

function withTextClip(page: PDFPage, draw: () => void) {
  page.pushOperators(
    pushGraphicsState(),
    rectangle(CLIP_X, CLIP_Y, CLIP_WIDTH, CLIP_HEIGHT),
    clip(),
    endPath(),
  );
  draw();
  page.pushOperators(popGraphicsState());
}

function drawLine(
  page: PDFPage,
  text: string,
  options: {
    face: Face;
    x: number;
    y: number;
    size: number;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  },
) {
  if (!text) return;

  const chars = Array.from(text);
  const fk = options.face.fk;
  if (fk) {
    const run = fk.layout(text, LAYOUT_FEATURES);
    if (run.positions.length === chars.length) {
      const scale = options.size / fk.unitsPerEm;
      let x = options.x;
      for (let i = 0; i < chars.length; i += 1) {
        const pos = run.positions[i];
        page.drawText(chars[i], {
          x: x + pos.xOffset * scale,
          y: options.y + pos.yOffset * scale,
          font: options.face.pdf,
          size: options.size,
          color: options.color,
          opacity: options.opacity ?? 1,
        });
        x += pos.xAdvance * scale;
      }
      return;
    }
  }

  page.drawText(text, {
    x: options.x,
    y: options.y,
    font: options.face.pdf,
    size: options.size,
    color: options.color,
    opacity: options.opacity ?? 1,
  });
}

function drawCentered(
  page: PDFPage,
  text: string,
  options: {
    face: Face;
    size: number;
    y: number;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  },
) {
  const size = fitSize(text, options.face, options.size, TEXT_WIDTH, 0.98);
  const width = measure(options.face, text, size);
  withTextClip(page, () => {
    drawLine(page, text, {
      face: options.face,
      x: (PAGE_WIDTH - width) / 2,
      y: options.y,
      size,
      color: options.color,
      opacity: options.opacity,
    });
  });
}

function drawRight(
  page: PDFPage,
  text: string,
  options: {
    face: Face;
    size: number;
    y: number;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  },
) {
  if (!text) return;
  const size = fitSize(text, options.face, options.size, TEXT_WIDTH, 0.9);
  const width = Math.min(TEXT_WIDTH, measure(options.face, text, size));
  drawLine(page, text, {
    face: options.face,
    x: PAGE_WIDTH - MARGIN_X - width,
    y: options.y,
    size,
    color: options.color,
    opacity: options.opacity,
  });
}
