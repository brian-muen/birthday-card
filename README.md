# Birthday Mail

A group birthday card that arrives like email. One person starts the card, friends each write a private note, and the birthday person opens the notes as messages — then turns them into a paper card.

Birthday Mail does not send email. You deliver the links yourself: paste each one into a text, an email, or the group chat.

## What you can do

- **Start a card.** Name who it’s for, pick a cover and paper, and leave an optional note for the people signing. Sign in with Google, then Send.
- **Collect notes in private.** Everyone with the signing link can write a message, choose a pen, and attach one photo. They see the organizer’s note and their own — never anyone else’s.
- **Keep the card.** Cards you start stay in Sent, so the links are still there later.
- **Hand it over when it’s ready.** Sharing the gift link is the delivery. A birthday on the card only tells signers when to sign by; nothing is scheduled or locked.
- **Open it two ways.** The birthday person reads the notes as mail, then Transform turns the inbox into a paper card they can flip through. Print downloads the whole card as a PDF.

## The three links

Each card has its own links. Whoever has a link can do what that link allows.

| Link | Who it’s for | What it does |
| --- | --- | --- |
| Signing | Everyone writing a note | Write one note. Does not show other people’s notes. |
| Gift | The birthday person | Read every note, flip through the paper card, and download a PDF. |
| Organizer | You | Read every note, remove one if you need to, and get the links again. |

Only starting a card needs an account. Signing a card and opening one do not.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local development uses an embedded Postgres database in `.pglite/` (gitignored), so there is nothing else to install. Set `DATABASE_URL` to use hosted Postgres instead, for example Neon.

Starting a card needs Google sign-in, including locally. Without it, the home screen still loads, but Send cannot go through. Signing and opening a card never need these settings.

1. In [Google Cloud](https://console.cloud.google.com/apis/credentials), create an OAuth client of type **Web application**.
2. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain/api/auth/google/callback`
3. Put these in `.env.local` (and in your host’s environment):

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_URL=http://localhost:3000
```

`APP_URL` is the public origin with no trailing slash, so the redirect Google sees matches the one in the console.

## Stack

Next.js (App Router), React, TypeScript, and Tailwind CSS. Data is stored with Drizzle ORM on Postgres — PGlite locally, hosted Postgres when `DATABASE_URL` is set. Tables are created on first use.

## Extra scripts

`scripts/birthday_message.py` writes the usual nudge for a signing link and copies it to the clipboard:

```bash
python3 scripts/birthday_message.py Sarah 2026-10-03 https://…/sign/abc
```

Run it with no arguments to be asked for the name, date, and link. Add `--except` with the birthday person’s Slack email or member ID to DM everyone else in the workspace. It lists who will get it and asks before sending. `--dry-run` stops after the list. It reads `SLACK_BOT_TOKEN` from `.env.local`; the bot needs `chat:write`, `im:write`, `users:read`, and `users:read.email`.

`scripts/seed-demo.mjs` fills the local database with sample cards. Stop the dev server first, then:

```bash
node scripts/seed-demo.mjs
```
