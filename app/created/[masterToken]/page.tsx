import { notFound } from "next/navigation";
import Link from "next/link";
import { count, eq } from "drizzle-orm";

import { claimCard } from "@/app/actions/claim-card";
import ActionButton from "@/components/action-button";
import CardPreview from "@/components/card-preview";
import { OrganizerIcons, signInHref } from "@/components/mail/organizer-icons";
import { MailIcon } from "@/components/mail/outbox-icons";
import OutboxLink from "@/components/mail/outbox-link";
import Computer from "@/components/os/computer";
import OsWindow from "@/components/os/os-window";
import { PixelIcon } from "@/components/os/pixel-icon";
import { birthdayTiming } from "@/lib/birthday";
import { ensureGiftToken } from "@/lib/card-access";
import { getDb } from "@/lib/db";
import { cards, messages } from "@/lib/db/schema";
import { parseDesign } from "@/lib/design";
import { isPaperCut, paperCut } from "@/lib/paper-cut";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { parseStock } from "@/lib/stock";
import "@/app/outbox.css";

function noteCountLabel(n: number) {
  if (n === 0) return "No notes yet";
  if (n === 1) return "1 note so far";
  return `${n} notes so far`;
}

const startedFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CardCreated({
  params,
  searchParams,
}: {
  params: Promise<{ masterToken: string }>;
  searchParams: Promise<{
    saved?: string;
    saveError?: string;
  }>;
}) {
  const { masterToken } = await params;
  const status = await searchParams;
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

  const name = card.recipientName;
  const herePath = `/created/${masterToken}`;
  const savedToThisAccount = organizer != null && card.organizerId === organizer.id;
  // Only cards started before sign-in was required can still be saved.
  const showSave = card.organizerId == null || (savedToThisAccount && status.saved);
  const design = parseDesign(card.design);
  const stage = isPaperCut(design) ? paperCut(design).stage : "#e4dcd2";
  const birthday = card.birthday ? birthdayTiming(card.birthday) : null;
  const giftWhen =
    birthday?.when === "upcoming"
      ? `Send on ${birthday.day}`
      : birthday?.when === "today"
        ? "Send today"
        : "Send when the card is ready";

  return (
    <Computer
      stock={card.stock}
      icons={<OrganizerIcons signedIn={organizer != null} next={herePath} />}
    >
      <div className="outbox">
        <OsWindow
          title="Sent"
          width="42rem"
          draggable
          className="outbox-window"
          status={
            <>
              <span>{noteCountLabel(noteCount)}</span>
              {birthday ? <span>Birthday {birthday.day}</span> : null}
              {card.createdAt ? <span>Started {startedFormat.format(card.createdAt)}</span> : null}
            </>
          }
        >
          <header className="outbox-head">
            <h1>{name}’s card is ready to go around</h1>
            <p>
              Birthday Mail doesn’t email anyone. You deliver these two messages
              yourself: paste each link into an email, a text, or the group chat.
            </p>
          </header>

          <ul className="outbox-messages">
            <li className="outbox-message">
              <PixelIcon name="mail" className="outbox-message-icon" />
              <div className="outbox-message-main">
                <div className="outbox-message-head">
                  <h3>Sign {name}’s birthday card</h3>
                  <span className="outbox-when" data-when="now">
                    Send now
                  </span>
                </div>
                <p className="outbox-to">To everyone signing</p>
                <p className="outbox-about">
                  Everyone who opens it can write a note in the card.
                  {birthday?.signBy ? ` It asks them to sign by ${birthday.signBy}.` : null}
                </p>
                <OutboxLink
                  path={`/sign/${card.contributeToken}`}
                  label="Signing link"
                  openLabel="Open the signing page"
                  shareTitle={`Sign ${name}'s birthday card`}
                  shareText={
                    birthday?.signBy
                      ? `Write a private note in ${name}'s birthday card by ${birthday.signBy}.`
                      : `Write a private note in ${name}'s birthday card.`
                  }
                />
              </div>
            </li>
            <li className="outbox-message">
              <MailIcon name="gift" className="outbox-message-icon" />
              <div className="outbox-message-main">
                <div className="outbox-message-head">
                  <h3>Happy birthday, {name}</h3>
                  <span className="outbox-when" data-when="later">
                    {giftWhen}
                  </span>
                </div>
                <p className="outbox-to">To {name}</p>
                <p className="outbox-about">
                  Opens the finished card with every note inside. Hold on to it
                  until everyone has signed.
                </p>
                <OutboxLink
                  path={`/card/${card.giftToken}`}
                  label="Gift link"
                  openLabel="Open the card as the birthday person sees it"
                  shareTitle={`${name}'s birthday card`}
                  shareText={`A birthday card for ${name}.`}
                />
              </div>
            </li>
          </ul>

          <section className="outbox-private" aria-labelledby="organizer-link-heading">
            <MailIcon name="lock" className="outbox-message-icon" />
            <div className="outbox-message-main">
              <div className="outbox-message-head">
                <h3 id="organizer-link-heading">Your organizer link</h3>
                <span className="outbox-when" data-when="private">
                  Private
                </span>
              </div>
              <p className="outbox-about">
                Keep this one to yourself. Open it to read notes as they come in
                and remove any you don’t want on the card.
                {savedToThisAccount ? " It’s also saved to your account." : null}
              </p>
              <OutboxLink
                path={`/card/${card.masterToken}`}
                label="Organizer link"
                openLabel="Open the organizer view"
                shareTitle={`${name}'s card (organizer)`}
                shareText={`Your organizer link for ${name}'s card. Keep this private.`}
              />
            </div>
          </section>
        </OsWindow>

        <div className="outbox-side">
          <OsWindow title={`${name}’s card`} width="17rem" className="outbox-preview" draggable>
            <div className="outbox-preview-stage" style={{ ["--stage" as string]: stage }}>
              <CardPreview name={name} stock={parseStock(card.stock)} design={design} compact />
            </div>
          </OsWindow>

          {showSave ? (
            <OsWindow title="Save this card" width="17rem" className="outbox-save" draggable>
              <div className="outbox-save-body">
                {savedToThisAccount ? (
                  <p role="status">
                    Saved. Find it again in <Link href="/cards">Sent cards</Link>.
                  </p>
                ) : organizer ? (
                  <>
                    <p>
                      Save it to {organizer.email} so you can find these links
                      later. A lost organizer link can’t be recovered on its own.
                    </p>
                    {status.saveError === "taken" ? (
                      <p role="alert" className="outbox-error">
                        This card is already saved to another account.
                      </p>
                    ) : null}
                    <form action={claimCard}>
                      <input type="hidden" name="masterToken" value={masterToken} />
                      <ActionButton pendingLabel="Saving…" className="os-button">
                        Save to my account
                      </ActionButton>
                    </form>
                  </>
                ) : (
                  <>
                    <p>
                      Sign in with Google to keep this card in Sent. A lost
                      organizer link can’t be recovered.
                    </p>
                    <Link href={signInHref(herePath)} className="os-button">
                      Save with Google
                    </Link>
                  </>
                )}
              </div>
            </OsWindow>
          ) : null}
        </div>
      </div>
    </Computer>
  );
}
