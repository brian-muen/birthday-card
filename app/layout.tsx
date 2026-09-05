import type { Metadata } from "next";
import { Caveat, EB_Garamond, Karla } from "next/font/google";
import "./globals.css";

// Garamond sets the messages and headlines.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Karla carries the interface: labels, buttons, meta.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

// Caveat is reserved for signatures — names only, never body text.
const caveat = Caveat({
  variable: "--font-caveat",
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
      className={`${karla.variable} ${garamond.variable} ${caveat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
