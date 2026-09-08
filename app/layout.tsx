import type { Metadata } from "next";
import {
  Caveat,
  Caveat_Brush,
  Cormorant_Garamond,
  EB_Garamond,
  Great_Vibes,
  Karla,
  Satisfy,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";

// Garamond sets site headlines. Karla carries the interface.
// paper.css loads after card-motion.css from globals.css.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
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

export const metadata: Metadata = {
  title: "Birthday Card",
  description:
    "Start a birthday card and collect private messages from everyone. Share the finished card with the birthday person when you are ready.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${karla.variable} ${garamond.variable} ${caveat.variable} ${greatVibes.variable} ${cormorant.variable} ${sourceSans.variable} ${caveatBrush.variable} ${satisfy.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
