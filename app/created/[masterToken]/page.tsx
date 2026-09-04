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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <section className="flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase sm:mx-0">
          Card created
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {card.occasion} card for {card.recipientName} is ready
        </h1>
        <p className="mx-auto max-w-xl text-balance text-amber-950/70 sm:mx-0">
          Two links, two jobs. Share the first one, guard the second.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5 sm:p-8">
        <h2 className="text-lg font-semibold">Contributor link</h2>
        <p className="mt-1 text-sm text-amber-950/65">
          Send this to friends so they can add a message. They&rsquo;ll only see
          their own note, never anyone else&rsquo;s.
        </p>
        <div className="mt-4">
          <CopyLink path={`/sign/${card.contributeToken}`} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-amber-900/5 ring-1 ring-rose-200 sm:p-8">
        <h2 className="text-lg font-semibold text-rose-700">
          Master link &mdash; private!
        </h2>
        <p className="mt-1 text-sm text-amber-950/65">
          This shows all messages. Keep it to yourself while the card fills up,
          then send it to {card.recipientName} when you&rsquo;re ready.
        </p>
        <div className="mt-4">
          <CopyLink path={`/card/${card.masterToken}`} />
        </div>
        <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          Save the master link somewhere safe right now &mdash; email it to
          yourself or bookmark it. There are no accounts here, so if you lose
          this link there is no way to recover the card.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/card/${card.masterToken}`}
          className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-600 hover:to-amber-600"
        >
          View the card
        </Link>
        <Link
          href={`/sign/${card.contributeToken}`}
          className="rounded-xl bg-white px-6 py-3.5 text-center text-base font-semibold text-amber-950 ring-1 ring-amber-900/10 transition hover:bg-amber-50"
        >
          Preview the contributor page
        </Link>
      </div>
    </main>
  );
}
