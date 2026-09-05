import { asc, eq } from "drizzle-orm";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { findCardByToken, isMasterLink } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { parseFace, type FaceId } from "@/lib/face";
import { parseStock, stockRgb } from "@/lib/stock";

const FACE_FILES: Record<FaceId, { regular: string; italic?: string }> = {
  hand: { regular: "caveat.ttf" },
  script: { regular: "great-vibes.ttf" },
  serif: { regular: "cormorant.ttf", italic: "cormorant-italic.ttf" },
  print: { regular: "source-sans.ttf" },
  marker: { regular: "caveat-brush.ttf" },
};

// Palette lifted from globals.css so the PDF matches the site.
const INK = rgb(0.106, 0.141, 0.251); // --ink #1b2440
const BRASS = rgb(0.659, 0.475, 0.173); // --brass #a8792c

// A5 portrait — a nice keepsake-card size.
const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 595;
const MARGIN_X = 56;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const BODY_SIZE = 12;
const BODY_LINE_HEIGHT = 19;
// Vertical space reserved for the page header and the author footer.
const CONTENT_TOP = PAGE_HEIGHT - 84;
const CONTENT_BOTTOM = 112;
const MAX_BODY_LINES_PER_PAGE = Math.floor(
  (CONTENT_TOP - CONTENT_BOTTOM) / BODY_LINE_HEIGHT,
);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ masterToken: string }> },
) {
  const { masterToken: token } = await params;

  const card = await findCardByToken(token);

  if (!card) {
    return new Response("Card not found", { status: 404 });
  }

  const db = await getDb();
  const showCount = isMasterLink(card, token);

  const notes = await db.query.messages.findMany({
    where: eq(messages.cardId, card.id),
    orderBy: [asc(messages.createdAt), asc(messages.id)],
  });

  const pdfBytes = await buildCardPdf({
    recipientName: card.recipientName,
    intro: card.intro,
    stock: parseStock(card.stock),
    font: parseFace(card.font),
    showCount,
    notes: notes.map((note) => ({
      authorName: note.authorName,
      body: note.body,
      date: dateFormatter.format(note.createdAt),
    })),
  });

  const asciiName =
    card.recipientName.replace(/[^\w \-]/g, "").trim() || "you";

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Birthday card for ${asciiName}.pdf"; filename*=UTF-8''${encodeURIComponent(
        `Birthday card for ${card.recipientName}.pdf`,
      )}`,
      // The master link is secret — never cache or index the PDF.
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

type PdfNote = { authorName: string; body: string; date: string };

async function embedFace(doc: PDFDocument, face: FaceId) {
  doc.registerFontkit(fontkit);
  const files = FACE_FILES[face];
  const dir = path.join(process.cwd(), "lib/fonts");
  const regular = await doc.embedFont(
    await readFile(path.join(dir, files.regular)),
  );
  const italic = files.italic
    ? await doc.embedFont(await readFile(path.join(dir, files.italic)))
    : regular;
  return { writing: regular, writingItalic: italic };
}

async function buildCardPdf(input: {
  recipientName: string;
  intro: string | null;
  stock: string;
  font: FaceId;
  showCount: boolean;
  notes: PdfNote[];
}) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Happy Birthday, ${input.recipientName}`);

  const { writing, writingItalic } = await embedFace(doc, input.font);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  // Drop anything the embedded face can't encode (emoji etc.).
  const sanitize = makeSanitizer(writing);
  const paper = (() => {
    const { r, g, b } = stockRgb(input.stock);
    return rgb(r, g, b);
  })();

  const titleSize = input.font === "script" ? 26 : 28;

  drawCoverPage(doc, {
    writing,
    writingItalic,
    sans,
    paper,
    titleSize,
    recipientName: sanitize(input.recipientName),
    dedication: input.showCount
      ? null
      : "From your brothers and sisters in Christ",
    messageCount: input.showCount ? input.notes.length : null,
  });

  input.notes.forEach((note, i) => {
    drawMessagePages(doc, {
      writing,
      writingItalic,
      sans,
      paper,
      body: sanitize(note.body),
      authorName: sanitize(note.authorName),
      date: note.date,
      pageNumber: i + 1,
      pageTotal: input.notes.length,
    });
  });

  return doc.save();
}

function addDecoratedPage(
  doc: PDFDocument,
  paper: ReturnType<typeof rgb>,
): PDFPage {
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: paper,
  });

  // Thin frame, like the card's border on screen.
  page.drawRectangle({
    x: 14,
    y: 14,
    width: PAGE_WIDTH - 28,
    height: PAGE_HEIGHT - 28,
    borderColor: INK,
    borderOpacity: 0.15,
    borderWidth: 0.75,
  });

  // Bound-edge detail down the left side.
  page.drawLine({
    start: { x: 34, y: 44 },
    end: { x: 34, y: PAGE_HEIGHT - 44 },
    color: INK,
    opacity: 0.08,
    thickness: 0.75,
  });

  return page;
}

function drawCoverPage(
  doc: PDFDocument,
  input: {
    writing: PDFFont;
    writingItalic: PDFFont;
    sans: PDFFont;
    paper: ReturnType<typeof rgb>;
    recipientName: string;
    dedication: string | null;
    messageCount: number | null;
    titleSize: number;
  },
) {
  const page = addDecoratedPage(doc, input.paper);

  const titleLines = [
    { text: "Happy Birthday,", font: input.writingItalic },
    ...wrapText(
      input.recipientName,
      input.writingItalic,
      input.titleSize,
      TEXT_WIDTH,
    ).map((text) => ({ text, font: input.writingItalic })),
  ];

  const introLines = input.dedication
    ? wrapText(input.dedication, input.writingItalic, 12, TEXT_WIDTH - 24)
    : [];

  const countText =
    input.messageCount === null
      ? null
      : input.messageCount === 0
        ? "No messages inside yet."
        : input.messageCount === 1
          ? "One message inside. Turn the page."
          : `${input.messageCount} messages inside. Turn the page.`;

  // Measure the whole block so we can center it vertically.
  const titleHeight = titleLines.length * 36;
  const introHeight = introLines.length > 0 ? introLines.length * 18 + 24 : 0;
  const totalHeight = 8 + 28 + titleHeight + 24 + 24 + introHeight + 20;

  let y = (PAGE_HEIGHT + totalHeight) / 2;

  drawTracked(page, "A BIRTHDAY CARD", {
    font: input.sans,
    size: 8,
    tracking: 2.5,
    y,
    color: INK,
    opacity: 0.45,
  });
  y -= 8 + 28;

  for (const line of titleLines) {
    y -= input.titleSize;
    drawCentered(page, line.text, {
      font: line.font,
      size: input.titleSize,
      y,
      color: INK,
    });
    y -= 8;
  }

  y -= 24;
  page.drawLine({
    start: { x: PAGE_WIDTH / 2 - 32, y },
    end: { x: PAGE_WIDTH / 2 + 32, y },
    color: BRASS,
    opacity: 0.6,
    thickness: 0.75,
  });
  y -= 24;

  if (introLines.length > 0) {
    for (const line of introLines) {
      y -= 14;
      drawCentered(page, line, {
        font: input.writingItalic,
        size: 12,
        y,
        color: INK,
        opacity: 0.65,
      });
      y -= 4;
    }
    y -= 24;
  }

  if (countText) {
    y -= 10;
    drawCentered(page, countText, {
      font: input.sans,
      size: 9,
      y,
      color: INK,
      opacity: 0.5,
    });
  }
}

function drawMessagePages(
  doc: PDFDocument,
  input: {
    writing: PDFFont;
    writingItalic: PDFFont;
    sans: PDFFont;
    paper: ReturnType<typeof rgb>;
    body: string;
    authorName: string;
    date: string;
    pageNumber: number;
    pageTotal: number;
  },
) {
  const lines = wrapText(input.body, input.writing, BODY_SIZE, TEXT_WIDTH);

  // Split very long messages across several PDF pages.
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += MAX_BODY_LINES_PER_PAGE) {
    chunks.push(lines.slice(i, i + MAX_BODY_LINES_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  chunks.forEach((chunk, chunkIndex) => {
    const page = addDecoratedPage(doc, input.paper);
    const isLastChunk = chunkIndex === chunks.length - 1;

    const header =
      chunks.length > 1 && chunkIndex > 0
        ? `${input.pageNumber} of ${input.pageTotal}, continued`
        : `${input.pageNumber} of ${input.pageTotal}`;
    drawCentered(page, header, {
      font: input.sans,
      size: 10,
      y: PAGE_HEIGHT - 56,
      color: INK,
      opacity: 0.35,
    });

    // Single-page messages sit vertically centered, like on screen;
    // multi-page messages fill from the top.
    const blockHeight = chunk.length * BODY_LINE_HEIGHT;
    let y =
      chunks.length === 1
        ? CONTENT_BOTTOM +
          (CONTENT_TOP - CONTENT_BOTTOM + blockHeight) / 2 -
          BODY_LINE_HEIGHT
        : CONTENT_TOP - BODY_LINE_HEIGHT;

    for (const line of chunk) {
      if (line) {
        page.drawText(line, {
          x: MARGIN_X,
          y,
          font: input.writing,
          size: BODY_SIZE,
          color: INK,
          opacity: 0.9,
        });
      }
      y -= BODY_LINE_HEIGHT;
    }

    if (isLastChunk) {
      const signature = `- ${input.authorName}`;
      const signatureWidth = input.writingItalic.widthOfTextAtSize(
        signature,
        12,
      );
      page.drawText(signature, {
        x: PAGE_WIDTH - MARGIN_X - signatureWidth,
        y: 74,
        font: input.writingItalic,
        size: 12,
        color: INK,
      });

      const dateWidth = input.sans.widthOfTextAtSize(input.date, 7.5);
      page.drawText(input.date, {
        x: PAGE_WIDTH - MARGIN_X - dateWidth,
        y: 60,
        font: input.sans,
        size: 7.5,
        color: INK,
        opacity: 0.4,
      });
    }
  });
}

/** Only keep characters the standard PDF fonts can encode. */
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

/** Greedy word wrap that preserves blank lines and breaks over-long words. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/[ ]+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);

      // Hard-break words wider than a full line.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let i = 1;
        while (
          i < rest.length &&
          font.widthOfTextAtSize(rest.slice(0, i + 1), size) <= maxWidth
        ) {
          i++;
        }
        lines.push(rest.slice(0, i));
        rest = rest.slice(i);
      }
      current = rest;
    }
    lines.push(current);
  }

  return lines;
}

function drawCentered(
  page: PDFPage,
  text: string,
  options: {
    font: PDFFont;
    size: number;
    y: number;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  },
) {
  const width = options.font.widthOfTextAtSize(text, options.size);
  page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: options.y,
    font: options.font,
    size: options.size,
    color: options.color,
    opacity: options.opacity ?? 1,
  });
}

/** Centered text with manual letter-spacing (pdf-lib has no tracking option). */
function drawTracked(
  page: PDFPage,
  text: string,
  options: {
    font: PDFFont;
    size: number;
    tracking: number;
    y: number;
    color: ReturnType<typeof rgb>;
    opacity?: number;
  },
) {
  const chars = Array.from(text);
  const totalWidth =
    chars.reduce(
      (sum, ch) => sum + options.font.widthOfTextAtSize(ch, options.size),
      0,
    ) +
    options.tracking * (chars.length - 1);

  let x = (PAGE_WIDTH - totalWidth) / 2;
  for (const ch of chars) {
    page.drawText(ch, {
      x,
      y: options.y,
      font: options.font,
      size: options.size,
      color: options.color,
      opacity: options.opacity ?? 1,
    });
    x += options.font.widthOfTextAtSize(ch, options.size) + options.tracking;
  }
}
