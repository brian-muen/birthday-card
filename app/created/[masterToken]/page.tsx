import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { CopyLink } from "@/components/copy-button";
import { ensureGiftToken } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";

export default async function CardCreated({
  params,
}: {
  params: Promise<{ masterToken: string }>;
}) {
  const { masterToken } = await params;

  const db = await getDb();
  const found = await db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });

  if (!found) {
    notFound();
  }

  const card = await ensureGiftToken(found);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
      <h1 className="font-serif text-[2.25rem] leading-[1.15] tracking-[-0.01em] sm:text-[2.75rem]">
        {card.recipientName}&rsquo;s card is ready.
      </h1>
      <p className="mt-5 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted">
        Three links. One for signers, one for {card.recipientName}, and one
        you keep.
      </p>

      <section className="mt-14">
        <h2 className="font-serif text-[1.5rem] leading-tight">
          Share this with everyone signing
        </h2>
        <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
          Each person writes their own note and can&rsquo;t read anyone
          else&rsquo;s.
        </p>
        <div className="mt-5">
          <CopyLink path={`/sign/${card.contributeToken}`} />
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-serif text-[1.5rem] leading-tight">
          Send this to {card.recipientName}
        </h2>
        <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
          The card as they&rsquo;ll open it.
        </p>
        <div className="mt-5">
          <CopyLink path={`/card/${card.giftToken}`} />
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-serif text-[1.5rem] leading-tight">
          Keep this one for yourself
        </h2>
        <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
          Same card, plus a way to take a note out if you need to.
        </p>
        <div className="mt-5">
          <CopyLink path={`/card/${card.masterToken}`} />
        </div>
        <p className="mt-5 max-w-[60ch] border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed">
          Save it somewhere you&rsquo;ll find it again — email it to yourself
          or bookmark it now. There are no accounts here, so a lost link
          can&rsquo;t be recovered.
        </p>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link
          href={`/card/${card.giftToken}`}
          className="bg-ink px-7 py-3 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-[#121a31]"
        >
          Open what they&rsquo;ll see
        </Link>
        <Link
          href={`/sign/${card.contributeToken}`}
          className="text-[0.9375rem] font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:decoration-brass"
        >
          See what signers see
        </Link>
      </div>
    </main>
  );
}
