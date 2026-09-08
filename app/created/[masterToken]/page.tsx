import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { notifySlack } from "@/app/actions/notify-slack";
import { CopyLink } from "@/components/copy-button";
import { ensureGiftToken } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";

export default async function CardCreated({
  params,
  searchParams,
}: {
  params: Promise<{ masterToken: string }>;
  searchParams: Promise<{
    slackSent?: string;
    slackSkipped?: string;
    slackTo?: string;
    slackFailed?: string;
    slackError?: string;
  }>;
}) {
  const { masterToken } = await params;
  const slack = await searchParams;

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

      <ol className="mt-10 grid gap-3 border-y border-rule py-5 text-sm text-muted sm:grid-cols-3">
        <li><span className="font-serif text-brass">01</span> Share the signing link</li>
        <li><span className="font-serif text-brass">02</span> Watch the notes arrive</li>
        <li><span className="font-serif text-brass">03</span> Send the card when ready</li>
      </ol>

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

      <details className="mt-20 border-t border-rule pt-8">
        <summary className="cursor-pointer font-serif text-[1.5rem] leading-tight underline decoration-rule decoration-1 underline-offset-4">Invite people in Slack</summary>
      <section className="mt-8">
        <h2 className="font-serif text-[1.5rem] leading-tight">
          Text everyone except {card.recipientName}
        </h2>
        <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
          Slack DMs the signing link to the workspace. {card.recipientName}{" "}
          is skipped, so the card stays a surprise.
        </p>
        {slack.slackError ? (
          <p
            role="alert"
            className="mt-5 max-w-[56ch] border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed"
          >
            {slack.slackError}
          </p>
        ) : null}
        {slack.slackSent ? (
          <div
            role="status"
            className="mt-5 max-w-[56ch] border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed"
          >
            <p>
              Messaged {slack.slackSent}{" "}
              {slack.slackSent === "1" ? "person" : "people"}
              {slack.slackSkipped ? `. Skipped ${slack.slackSkipped}` : ""}.
            </p>
            {slack.slackTo ? (
              <ul className="mt-3 list-disc pl-5">
                {slack.slackTo.split("|").map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : null}
            {slack.slackFailed ? (
              <p className="mt-3">
                Did not go through: {slack.slackFailed.split("|").join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        <form action={notifySlack} className="mt-6 max-w-md">
          <input type="hidden" name="masterToken" value={masterToken} />
          <label
            htmlFor="exclude"
            className="block text-[0.9375rem] font-medium"
          >
            {card.recipientName}&rsquo;s Slack email or member ID
          </label>
          <input
            id="exclude"
            name="exclude"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="name@email.com or U01234567"
            className="field mt-2.5"
          />
          <label
            htmlFor="birthday"
            className="mt-6 block text-[0.9375rem] font-medium"
          >
            Birthday
          </label>
          <input
            id="birthday"
            name="birthday"
            type="date"
            required
            className="field mt-2.5"
          />
          <label
            htmlFor="password"
            className="mt-6 block text-[0.9375rem] font-medium"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field mt-2.5"
          />
          <button
            type="submit"
            className="mt-6 bg-ink px-7 py-3 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-[#121a31]"
          >
            Send the DMs
          </button>
        </form>
      </section>
      </details>

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
