// Seeds the local PGlite database with demo cards. Stop `next dev` first:
// PGlite allows one process at a time.
//
//   PGLITE_DIR=/tmp/bday-pglite node scripts/seed-demo.mjs

import { PGlite } from "@electric-sql/pglite";

const db = new PGlite(process.env.PGLITE_DIR ?? ".pglite");

// Calendar days in UTC, the same "today" the app uses.
function daysFromNow(days) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

const cards = [
  {
    name: "Sarah",
    design: "cut-balloons",
    stock: "sky",
    birthday: daysFromNow(5),
    intro: "We're giving it to her at dinner. Bring your best memories!",
    tokens: ["DemoSignSarahxxxxxxxxxxx", "DemoMasterSarahxxxxxxxxx", "DemoGiftSarahxxxxxxxxxxx"],
    notes: [
      ["Mina", "fountain", "Happy birthday Sarah! Thank you for every late-night study session and for always bringing snacks nobody asked for but everybody needed. This year is going to be so good."],
      ["Daniel", "marker", "HAPPY BIRTHDAY!!! You are the best roommate and the worst at Mario Kart. Both are facts."],
      ["Grace", "pencil", "Sarah, I still remember the first time we met at the welcome dinner. You made a room of strangers feel like friends in about five minutes. I hope today you feel even a little of the warmth you give everyone else.\n\nLove you lots,\nGrace"],
      ["Joel", "ballpoint", "Happy birthday! Let's finally do the hike we keep talking about."],
      ["Esther", "brush", "생일 축하해! Have the loveliest day."],
    ],
  },
  {
    name: "Theo",
    design: "cut-cake",
    stock: "butter",
    birthday: daysFromNow(12),
    intro: null,
    tokens: ["DemoSignTheoxxxxxxxxxxxx", "DemoMasterTheoxxxxxxxxxx", "DemoGiftTheoxxxxxxxxxxxx"],
    notes: [["Priya", "fountain", "Happy birthday, Theo. Here's to another year of you being wonderful."]],
  },
  {
    name: "Ruth",
    design: "moon",
    stock: "blush",
    birthday: null,
    intro: null,
    tokens: ["DemoSignRuthxxxxxxxxxxxx", "DemoMasterRuthxxxxxxxxxx", "DemoGiftRuthxxxxxxxxxxxx"],
    notes: [],
  },
];

for (const card of cards) {
  const [contribute, master, gift] = card.tokens;
  await db.query("DELETE FROM cards WHERE master_token = $1", [master]);
  const { rows } = await db.query(
    `INSERT INTO cards (recipient_name, occasion, intro, birthday, stock, design, contribute_token, master_token, gift_token)
     VALUES ($1, 'Birthday', $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [card.name, card.intro, card.birthday, card.stock, card.design, contribute, master, gift],
  );
  const cardId = rows[0].id;
  for (const [index, [author, pen, body]] of card.notes.entries()) {
    await db.query(
      `INSERT INTO messages (card_id, author_name, body, pen, created_at)
       VALUES ($1, $2, $3, $4, now() - make_interval(hours => $5))`,
      [cardId, author, body, pen, (card.notes.length - index) * 3],
    );
  }
  console.log(`${card.name}: /card/${gift}  /card/${master}  /sign/${contribute}`);
}

await db.close();
