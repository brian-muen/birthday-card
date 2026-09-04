import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __cardDb?: Promise<Db> };

const ENSURE_TABLES = [
  `CREATE TABLE IF NOT EXISTS cards (
    id serial PRIMARY KEY,
    recipient_name text NOT NULL,
    occasion text NOT NULL,
    intro text,
    contribute_token text NOT NULL UNIQUE,
    master_token text NOT NULL UNIQUE,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id serial PRIMARY KEY,
    card_id integer NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
];

async function createDb(): Promise<Db> {
  let db: Db;
  if (process.env.DATABASE_URL) {
    // Hosted Postgres (e.g. Neon) in production.
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    db = drizzle(client, { schema }) as unknown as Db;
  } else {
    // Local development: embedded PGlite database, stored in .pglite/
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const client = new PGlite(process.env.PGLITE_DIR ?? ".pglite");
    db = drizzle(client, { schema }) as unknown as Db;
  }
  for (const stmt of ENSURE_TABLES) {
    await db.execute(sql.raw(stmt));
  }
  return db;
}

/** Get the shared database instance (creates tables on first use). */
export function getDb(): Promise<Db> {
  if (!globalForDb.__cardDb) {
    globalForDb.__cardDb = createDb();
  }
  return globalForDb.__cardDb;
}
