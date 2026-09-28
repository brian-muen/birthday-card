import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import {
  Caveat,
  Caveat_Brush,
  Cormorant_Garamond,
  EB_Garamond,
  Great_Vibes,
  Ma_Shan_Zheng,
  Nanum_Pen_Script,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Serif_KR,
  Noto_Serif_SC,
  Noto_Serif_TC,
  Bricolage_Grotesque,
  Pixelify_Sans,
  Satisfy,
  Sono,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";

// Bricolage Grotesque is the interface sans outside a letter.
// Sono is mail typed on this screen. Garamond is only printed on the card.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const ui = Bricolage_Grotesque({
  variable: "--font-ui",
  subsets: ["latin"],
  axes: ["opsz"],
});

// The computer's chrome: menu bar, window titles, buttons, header labels.
const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

// Mail typed on this screen. Sono is a soft monospace made to be read in
// paragraphs, so a letter looks like the computer's own face. The mono axis
// stays at its default. Pixelify is chrome; pens stay on the card.
const mail = Sono({
  variable: "--font-mail",
  subsets: ["latin"],
  weight: "variable",
});

// Cover greeting is printed Garamond. Signers pick a pen; each note uses that hand.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  variable: "--font-great-vibes",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const caveatBrush = Caveat_Brush({
  weight: "400",
  variable: "--font-caveat-brush",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  weight: "400",
  variable: "--font-satisfy",
  subsets: ["latin"],
});

// CJK faces are split across many files; don't preload the whole set.
const notoSansKR = Noto_Sans_KR({
  weight: ["400", "600"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-sans-kr",
});

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "600"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-sans-sc",
});

const notoSansTC = Noto_Sans_TC({
  weight: ["400", "600"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-sans-tc",
});

// Variable axis: Google serves one file for every weight, and listing weights
// duplicates its URLs, which next/font rejects.
const notoSerifKR = Noto_Serif_KR({
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-serif-kr",
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "500"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-serif-sc",
});

const notoSerifTC = Noto_Serif_TC({
  weight: ["400", "500"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-serif-tc",
});

const nanumPen = Nanum_Pen_Script({
  weight: "400",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-nanum-pen",
});

const maShan = Ma_Shan_Zheng({
  weight: "400",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-ma-shan",
});

const fontVariables = [
  ui.variable,
  pixel.variable,
  mail.variable,
  garamond.variable,
  caveat.variable,
  greatVibes.variable,
  cormorant.variable,
  sourceSans.variable,
  caveatBrush.variable,
  satisfy.variable,
  notoSansKR.variable,
  notoSansSC.variable,
  notoSansTC.variable,
  notoSerifKR.variable,
  notoSerifSC.variable,
  notoSerifTC.variable,
  nanumPen.variable,
  maShan.variable,
].join(" ");

export const metadata: Metadata = {
  title: { default: "Birthday Mail", template: "%s · Birthday Mail" },
  description:
    "Start a birthday card and collect private messages from everyone. Share the finished card with the birthday person when you are ready.",
};

// The screen runs edge to edge; the menu bar and windows pad for the notch.
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
