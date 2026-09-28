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

## Birthday message

`scripts/birthday_message.py` prints the usual nudge for a signing link and
copies it to the clipboard, ready to paste wherever the group talks:

```bash
python3 scripts/birthday_message.py Sarah 2026-10-03 https://…/sign/abc
```

Run it with no arguments to be asked for the name, date, and link.

Add `--except` with the birthday person's Slack email or member ID to DM
everyone else in the workspace instead. It lists who will get it and asks
before sending; `--dry-run` stops after the list. It reads `SLACK_BOT_TOKEN`
from `.env.local`, and the bot needs `chat:write`, `im:write`, `users:read`, and
`users:read.email`.

```bash
python3 scripts/birthday_message.py Sarah 2026-10-03 https://…/sign/abc --except sarah@example.com
```

## Demo data

`scripts/seed-demo.mjs` fills the local PGlite database with three cards
(many notes, one note, none). Stop `next dev` first, then:

```bash
node scripts/seed-demo.mjs
```

It prints each card's gift, organizer, and signing paths.

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
