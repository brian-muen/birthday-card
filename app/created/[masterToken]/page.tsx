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
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/45">
          Card created
        </p>
        <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          {card.recipientName}&rsquo;s {card.occasion.toLowerCase()} card is
          ready.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/60">
          Two links, two jobs. Share the first one, guard the second.
        </p>
      </header>

      <section className="mt-12 rounded-lg border border-foreground/12 bg-white p-6 sm:p-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/45">
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

      <section className="mt-5 rounded-lg border border-foreground/25 bg-white p-6 sm:p-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70">
          Master link &mdash; keep private
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          This opens the full card. Keep it to yourself while messages come
          in, then send it to {card.recipientName} when you&rsquo;re ready.
        </p>
        <div className="mt-4">
          <CopyLink path={`/card/${card.masterToken}`} />
        </div>
        <p className="mt-5 border-l-2 border-foreground/50 pl-3 text-sm leading-relaxed text-foreground/70">
          Save this link somewhere safe now &mdash; email it to yourself or
          bookmark it. There are no accounts, so a lost link means a lost
          card.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/card/${card.masterToken}`}
          className="flex-1 rounded-md bg-foreground px-6 py-3 text-center text-base font-medium text-background transition hover:bg-foreground/85"
        >
          Open the card
        </Link>
        <Link
          href={`/sign/${card.contributeToken}`}
          className="flex-1 rounded-md border border-foreground/25 bg-white px-6 py-3 text-center text-base font-medium transition hover:border-foreground/60"
        >
          Preview the signing page
        </Link>
      </div>
    </main>
  );
}
