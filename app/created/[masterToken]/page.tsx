import { notFound } from "next/navigation";
import Link from "next/link";
import { count, eq } from "drizzle-orm";

import { notifySlack } from "@/app/actions/notify-slack";
import { claimCard } from "@/app/actions/claim-card";
import ActionButton from "@/components/action-button";
import CardPreview from "@/components/card-preview";
import OrganizerBar from "@/components/organizer-bar";
import LinkPicker from "@/components/link-picker";
import { ensureGiftToken } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { parseDesign } from "@/lib/design";
import { isPaperCut, paperCut } from "@/lib/paper-cut";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { parseStock } from "@/lib/stock";
import "@/app/organizer.css";
import "@/app/handoff.css";

function noteCountLabel(n: number) {
  if (n === 0) return "No notes yet.";
  if (n === 1) return "1 note so far.";
  return `${n} notes so far.`;
}

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
    saved?: string;
    saveError?: string;
  }>;
}) {
  const { masterToken } = await params;
  const slack = await searchParams;
  const organizer = await getCurrentOrganizer();

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
  const savedToThisAccount =
    organizer != null && card.organizerId === organizer.id;
  const claimedBySomeoneElse =
    card.organizerId != null && card.organizerId !== organizer?.id;
  const accountHref = `/account?next=${encodeURIComponent(`/created/${masterToken}`)}`;
  const design = parseDesign(card.design);
  const stage = isPaperCut(design) ? paperCut(design).stage : "#e4dcd2";

  return (
    <>
      <OrganizerBar />
      <main className="handoff">
        <header className="handoff-head">
          <h1>{card.recipientName}&rsquo;s card</h1>
          <p>{noteCountLabel(noteCount)}</p>
        </header>

        <div className="handoff-desk">
          <LinkPicker
            links={[
              {
                id: "sign",
                label: "Sign",
                hint: "For the group",
                description: `Send this to everyone who should write in ${card.recipientName}’s card. Each person sees only their own note.`,
                path: signingPath,
                openLabel: "Open the signing page",
                shareTitle: `Sign ${card.recipientName}'s birthday card`,
                shareText: `Write a private note in ${card.recipientName}'s birthday card.`,
              },
              {
                id: "gift",
                label: "Gift",
                hint: `For ${card.recipientName}`,
                description: `When the card is ready, send this to ${card.recipientName}. Sharing it is how they receive the card.`,
                path: giftPath,
                openLabel: "Open the card",
                shareTitle: `${card.recipientName}'s birthday card`,
                shareText: `A birthday card for ${card.recipientName}.`,
              },
              {
                id: "organizer",
                label: "Organizer",
                hint: "Just for you",
                description: savedToThisAccount
                  ? "Keep this one private. It lets you read and remove notes, and the card is also saved to your account."
                  : "Keep this one private. It lets you read and remove notes, and a lost organizer link can’t be recovered.",
                path: organizerPath,
                openLabel: "Open as organizer",
                shareTitle: `${card.recipientName}'s card (organizer)`,
                shareText: `Your organizer link for ${card.recipientName}'s card. Keep this private.`,
              },
            ]}
          />

          <div className="handoff-object" style={{ ["--stage" as string]: stage }}>
            <CardPreview
              name={card.recipientName}
              stock={parseStock(card.stock)}
              design={design}
              compact
            />
          </div>
        </div>

        {claimedBySomeoneElse ? null : (
          <section className="handoff-save" aria-labelledby="save-heading">
            <h2 id="save-heading">Save this card</h2>
            {savedToThisAccount ? (
              <p>
                {slack.saved
                  ? "Saved to your account. Find it again in "
                  : "This card is in "}
                <Link href="/cards" className="handoff-open">
                  your cards
                </Link>
                .
              </p>
            ) : organizer ? (
              <>
                <p>
                  Save it to {organizer.email} so you can find these links
                  later. A lost organizer link cannot be recovered on its own.
                </p>
                {slack.saveError === "taken" ? (
                  <p role="alert" className="form-error">
                    This card is already saved to another account.
                  </p>
                ) : null}
                <form action={claimCard}>
                  <input type="hidden" name="masterToken" value={masterToken} />
                  <ActionButton
                    pendingLabel="Saving…"
                    className="ui-button ui-button-primary"
                  >
                    Save to my account
                  </ActionButton>
                </form>
              </>
            ) : (
              <>
                <p>
                  Optional: save this card with Google. A lost organizer link
                  cannot be recovered.
                </p>
                <Link href={accountHref} className="ui-button">
                  Save with Google
                </Link>
              </>
            )}
          </section>
        )}

        {slack.slackError ? (
          <p role="alert" className="form-error handoff-slack-status">
            {slack.slackError}
          </p>
        ) : null}
        {slack.slackSent ? (
          <div role="status" className="handoff-slack-status">
            <p>
              Messaged {slack.slackSent}{" "}
              {slack.slackSent === "1" ? "person" : "people"}
              {slack.slackSkipped ? `. Skipped ${slack.slackSkipped}` : ""}.
            </p>
            {slack.slackTo ? (
              <ul>
                {slack.slackTo.split("|").map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : null}
            {slack.slackFailed ? (
              <p>Did not go through: {slack.slackFailed.split("|").join(", ")}</p>
            ) : null}
          </div>
        ) : null}

        <details className="handoff-slack">
          <summary>Invite people in Slack</summary>
          <section>
            <h2>Text everyone except {card.recipientName}</h2>
            <p>
              Slack DMs the signing link to the workspace. {card.recipientName}{" "}
              is skipped, so the card stays a surprise.
            </p>
            <form action={notifySlack} className="handoff-slack-form">
              <input type="hidden" name="masterToken" value={masterToken} />
              <label htmlFor="exclude">
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
                className="field"
              />
              <label htmlFor="birthday">Birthday</label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                required
                className="field"
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field"
              />
              <button type="submit" className="ui-button ui-button-primary">
                Send the DMs
              </button>
            </form>
          </section>
        </details>
      </main>
    </>
  );
}
