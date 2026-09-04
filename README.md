# Group Card

A Thankbox-style group card app. Create a card for someone, share a
**contributor link** so friends can privately leave messages (they never see
each other's messages), and keep a **master link** that shows every message —
send it to the recipient when you're ready.

## How it works

- No user accounts. Security comes from unguessable URL tokens.
- Each card has two independent 24-char tokens:
  - `contributeToken` → `/sign/[contributeToken]` — write-only message form
  - `masterToken` → `/card/[masterToken]` — view all messages, delete messages
- `/` — landing page with a create-card form. After creating, you're shown
  both links at `/created/[masterToken]`.

## Tech

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Drizzle ORM. Local dev uses an embedded PGlite database (`.pglite/`,
  gitignored, zero setup). Production uses hosted Postgres via `DATABASE_URL`
  (e.g. Neon on Vercel). Tables are auto-created on first use.

## Shared modules (the contract)

- `lib/db/schema.ts` — `cards` and `messages` tables, `Card`/`Message` types
- `lib/db/index.ts` — `getDb(): Promise<Db>` returns the Drizzle instance
- `lib/tokens.ts` — `generateToken()` for URL tokens

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

## Development

```bash
npm run dev
```
