import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  occasion: text("occasion").notNull(),
  intro: text("intro"),
  contributeToken: text("contribute_token").notNull().unique(),
  masterToken: text("master_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type Message = typeof messages.$inferSelect;
