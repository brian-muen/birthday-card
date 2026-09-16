import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const organizers = pgTable("organizers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  googleSub: text("google_sub").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizerSessions = pgTable("organizer_sessions", {
  token: text("token").primaryKey(),
  organizerId: integer("organizer_id")
    .notNull()
    .references(() => organizers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  occasion: text("occasion").notNull(),
  intro: text("intro"),
  stock: text("stock").notNull().default("red"),
  design: text("design").notNull().default("plain"),
  font: text("font").notNull().default("hand"),
  contributeToken: text("contribute_token").notNull().unique(),
  masterToken: text("master_token").notNull().unique(),
  giftToken: text("gift_token").unique(),
  organizerId: integer("organizer_id").references(() => organizers.id, {
    onDelete: "set null",
  }),
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
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Organizer = typeof organizers.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Message = typeof messages.$inferSelect;
