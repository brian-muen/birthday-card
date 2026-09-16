# Group Card

A Thankbox-style group card app. Create a card for someone, share a
**contributor link** so friends can privately leave messages (they never see
each other's messages), and keep a **master link** that shows every message —
send it to the recipient when you're ready.

## How it works

- Each card has unguessable URL tokens:
  - `contributeToken` → `/sign/[contributeToken]` — write-only message form
  - `giftToken` → `/card/[giftToken]` — read the finished card
  - `masterToken` → `/card/[masterToken]` — view all messages, delete messages
- `/` — landing page with a create-card form. After creating, you're shown
  the links at `/created/[masterToken]`.
- Organizer accounts are optional. Anyone can create a card without signing
  in. Google sign-in saves that card to `/cards` so a lost organizer link can
  be found later. Contributors never need an account.

## Tech

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Drizzle ORM. Local dev uses an embedded PGlite database (`.pglite/`,
  gitignored, zero setup). Production uses hosted Postgres via `DATABASE_URL`
  (e.g. Neon on Vercel). Tables are auto-created on first use.

## Shared modules (the contract)

- `lib/db/schema.ts` — `organizers`, `organizer_sessions`, `cards`, and `messages` tables
- `lib/db/index.ts` — `getDb(): Promise<Db>` returns the Drizzle instance
- `lib/tokens.ts` — `generateToken()` for URL tokens
- `lib/organizer-auth.ts` — optional organizer session cookie

Example usage in a server action:

```ts
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const db = await getDb();
const card = await db.query.cards.findFirst({
  where: eq(cards.masterToken, token),
});
```

## Slack DMs

After you create a card, the created page can DM everyone in the Slack
workspace except the birthday person, with the signing link.

1. Create an app from `slack-app-manifest.yaml` at [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**.
2. Install it to the workspace.
3. Set `SLACK_BOT_TOKEN` (`xoxb-…`), `SLACK_SIGNING_SECRET`, and
   `SLACK_NOTIFY_PASSWORD` in `.env.local` and on Vercel.
4. Optional: `APP_URL` if the signing links should use a host other than `https://manna-birthday-card.vercel.app`.

Sending DMs requires that password (created page field, or the last word of
`/card`). Sign and gift links stay public.

From Slack:

`/card except @name https://manna-birthday-card.vercel.app/sign/… PASSWORD`

## Organizer Google sign-in

Create and sign a card with no account. Google is only for organizers who want
to find those links later.

1. In [Google Cloud](https://console.cloud.google.com/apis/credentials), create
   an OAuth client of type **Web application**.
2. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` and on
   Vercel.
4. Set `APP_URL` to the public origin (no trailing slash) so the redirect URI
   Google sees matches the console exactly.

## Development

```bash
npm run dev
```
