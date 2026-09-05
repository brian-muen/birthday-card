import type { Metadata } from "next";
import {
  Caveat,
  Caveat_Brush,
  Cormorant_Garamond,
  EB_Garamond,
  Great_Vibes,
  Karla,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";

// Garamond sets site headlines. Karla carries the interface.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

// Card writing — one of these is chosen when the card is created.
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

export const metadata: Metadata = {
  title: "Birthday Card",
  description:
    "Start a birthday card, share one link, and collect a message from everyone. They stay hidden until the day you hand it over.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${karla.variable} ${garamond.variable} ${caveat.variable} ${greatVibes.variable} ${cormorant.variable} ${sourceSans.variable} ${caveatBrush.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
