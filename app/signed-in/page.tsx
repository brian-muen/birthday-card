import type { Metadata } from "next";

import { AnnounceSignedIn } from "@/components/mail/sign-in-watch";
import "@/app/signin.css";

export const metadata: Metadata = {
  title: "Signed in",
  robots: { index: false, follow: false },
};

export default function SignedInPage() {
  return <AnnounceSignedIn />;
}
