import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";

import { notifySlack } from "@/app/actions/notify-slack";
import { ShareLink } from "@/components/share-link";
import { ensureGiftToken } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";

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
  const [tally] = await db
    .select({ n: count() })
    .from(messages)
    .where(eq(messages.cardId, card.id));
  const noteCount = tally?.n ?? 0;

  const signingPath = `/sign/${card.contributeToken}`;
  const giftPath = `/card/${card.giftToken}`;
  const organizerPath = `/card/${card.masterToken}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
      <h1 className="font-serif text-[2.25rem] leading-[1.15] tracking-[-0.01em] sm:text-[2.75rem]">
        {card.recipientName}&rsquo;s card is ready.
      </h1>
      <p className="mt-5 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted">
        Share the signing link with everyone writing. When the notes are in,
        send the gift link — that is how the card arrives. Keep the organizer
        link to yourself.
      </p>
      <p className="mt-4 max-w-[56ch] text-[1.0625rem] leading-relaxed">
        {noteCount === 0
          ? "No notes yet — share the signing link."
          : noteCount === 1
            ? "1 note so far."
            : `${noteCount} notes so far.`}
      </p>

      <div className="mt-12 divide-y divide-rule border-y border-rule">
        <section className="py-8">
          <h2 className="font-serif text-[1.5rem] leading-tight">
            Signing link
          </h2>
          <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
            Share this with everyone writing. Each person writes their own note
            and can&rsquo;t read anyone else&rsquo;s.
          </p>
          <div className="mt-5">
            <ShareLink
              path={signingPath}
              copyLabel="Copy signing link"
              shareLabel="Share signing link"
              shareTitle={`Sign ${card.recipientName}'s birthday card`}
              shareText={`Write a private note in ${card.recipientName}'s birthday card.`}
            />
          </div>
        </section>

        <section className="py-8">
          <h2 className="font-serif text-[1.5rem] leading-tight">
            Gift link
          </h2>
          <p className="mt-2 max-w-[56ch] font-medium leading-relaxed">
            This is delivery. Send it to {card.recipientName} when you are
            ready — the card arrives when you send this link, not on its own.
          </p>
          <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
            The card as they&rsquo;ll open it — they can&rsquo;t take a note
            out from this link.
          </p>
          <div className="mt-5">
            <ShareLink
              path={giftPath}
              copyLabel="Copy gift link"
              shareLabel="Share gift link"
              shareTitle={`${card.recipientName}'s birthday card`}
              shareText={`A birthday card for ${card.recipientName}.`}
            />
          </div>
        </section>

        <section className="py-8">
          <h2 className="font-serif text-[1.5rem] leading-tight">
            Organizer link
          </h2>
          <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
            Keep this private. Same card, plus a way to take a note out if you
            need to.
          </p>
          <div className="mt-5">
            <ShareLink
              path={organizerPath}
              copyLabel="Copy organizer link"
              shareLabel="Share organizer link"
              shareTitle={`${card.recipientName}'s card (organizer)`}
              shareText={`Your organizer link for ${card.recipientName}'s card. Keep this private.`}
            />
          </div>
          <p className="mt-5 max-w-[60ch] border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed">
            Save it somewhere you&rsquo;ll find it again — email it to yourself
            or bookmark it now. There are no accounts here, so a lost link
            can&rsquo;t be recovered.
          </p>
        </section>
      </div>

      <p className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[0.9375rem] text-muted">
        <Link
          href={giftPath}
          className="font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brass"
        >
          Open what they&rsquo;ll see
        </Link>
        <Link
          href={signingPath}
          className="font-medium underline decoration-rule decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brass"
        >
          See what signers see
        </Link>
      </p>

      <details className="mt-14 border-t border-rule pt-8">
        <summary className="cursor-pointer text-[1.0625rem] leading-relaxed underline decoration-rule decoration-1 underline-offset-4">
          Invite people in Slack
        </summary>
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
    </main>
  );
}
