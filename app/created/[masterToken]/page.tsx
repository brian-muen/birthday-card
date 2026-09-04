import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { CopyLink } from "@/components/copy-button";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";

export default async function CardCreated({
  params,
}: {
  params: Promise<{ masterToken: string }>;
}) {
  const { masterToken } = await params;

  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });

  if (!card) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-16 sm:py-24">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Card created
        </p>
        <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          {card.recipientName}&rsquo;s birthday card is ready.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/60">
          Two links, two jobs. Share the first one, guard the second.
        </p>
      </header>

      <section className="shadow-card mt-12 rounded-2xl border border-accent/20 bg-paper p-6 sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Contributor link
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          Send this to friends so they can add a message. They&rsquo;ll only
          see their own note, never anyone else&rsquo;s.
        </p>
        <div className="mt-4">
          <CopyLink path={`/sign/${card.contributeToken}`} />
        </div>
      </section>

      <section className="shadow-card mt-5 rounded-2xl border border-gold/30 bg-paper p-6 sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Master link &mdash; keep private
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          This opens the full card. Keep it to yourself while messages come
          in, then send it to {card.recipientName} when you&rsquo;re ready.
        </p>
        <div className="mt-4">
          <CopyLink path={`/card/${card.masterToken}`} />
        </div>
        <p className="mt-5 rounded-r-lg border-l-2 border-gold/60 bg-gold/[0.06] py-2.5 pl-3 pr-3 text-sm leading-relaxed text-foreground/70">
          Save this link somewhere safe now &mdash; email it to yourself or
          bookmark it. There are no accounts, so a lost link means a lost
          card.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/card/${card.masterToken}`}
          className="flex-1 rounded-lg bg-accent px-6 py-3 text-center text-base font-medium text-white shadow-sm transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Open the card
        </Link>
        <Link
          href={`/sign/${card.contributeToken}`}
          className="flex-1 rounded-lg border border-foreground/20 bg-paper px-6 py-3 text-center text-base font-medium transition hover:border-accent hover:text-accent"
        >
          Preview the signing page
        </Link>
      </div>
    </main>
  );
}
