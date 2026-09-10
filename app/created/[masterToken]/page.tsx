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
    <main className="handoff">
      <header className="handoff-head">
        <h1>{card.recipientName}&rsquo;s card.</h1>
        <p>
          {noteCount === 0
            ? "No notes yet."
            : noteCount === 1
              ? "1 note so far."
              : `${noteCount} notes so far.`}
        </p>
      </header>

      <ol className="handoff-list">
        <li>
          <h2>Signing</h2>
          <p>For everyone writing.</p>
          <ShareLink
            path={signingPath}
            copyLabel="Copy"
            shareLabel="Share"
            openHref={signingPath}
            openLabel="Open"
            shareTitle={`Sign ${card.recipientName}'s birthday card`}
            shareText={`Write a private note in ${card.recipientName}'s birthday card.`}
          />
        </li>
        <li>
          <h2>Gift</h2>
          <p>How the card reaches {card.recipientName}.</p>
          <ShareLink
            path={giftPath}
            copyLabel="Copy"
            shareLabel="Share"
            openHref={giftPath}
            openLabel="Open"
            shareTitle={`${card.recipientName}'s birthday card`}
            shareText={`A birthday card for ${card.recipientName}.`}
          />
        </li>
        <li>
          <h2>Organizer</h2>
          <p>Keep this. A lost link can&rsquo;t be recovered.</p>
          <ShareLink
            path={organizerPath}
            copyLabel="Copy"
            shareLabel="Share"
            openHref={organizerPath}
            openLabel="Open"
            shareTitle={`${card.recipientName}'s card (organizer)`}
            shareText={`Your organizer link for ${card.recipientName}'s card. Keep this private.`}
          />
        </li>
      </ol>

      <details className="handoff-slack">
        <summary>Invite people in Slack</summary>
        <section>
          <h2 className="font-serif text-[1.35rem] leading-tight">
            Text everyone except {card.recipientName}
          </h2>
          <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">
            Slack DMs the signing link to the workspace. {card.recipientName}{" "}
            is skipped, so the card stays a surprise.
          </p>
          {slack.slackError ? (
            <p
              role="alert"
              className="mt-5 max-w-[56ch] text-[0.9375rem] leading-relaxed"
            >
              {slack.slackError}
            </p>
          ) : null}
          {slack.slackSent ? (
            <div
              role="status"
              className="mt-5 max-w-[56ch] text-[0.9375rem] leading-relaxed"
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
              className="ui-button ui-button-primary mt-6"
            >
              Send the DMs
            </button>
          </form>
        </section>
      </details>
    </main>
  );
}
