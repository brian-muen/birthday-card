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
  stock: text("stock").notNull().default("red"),
  font: text("font").notNull().default("hand"),
  contributeToken: text("contribute_token").notNull().unique(),
  masterToken: text("master_token").notNull().unique(),
  giftToken: text("gift_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  pen: text("pen").notNull().default("pencil"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type Message = typeof messages.$inferSelect;
