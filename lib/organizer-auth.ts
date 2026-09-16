import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { attachCardToOrganizer } from "@/lib/claim-card";
import { getDb } from "@/lib/db";
import { organizerSessions, organizers, type Organizer } from "@/lib/db/schema";
import { createdMasterToken, safeNextPath } from "@/lib/safe-next-path";
import { generateToken } from "@/lib/tokens";

export const SESSION_COOKIE = "organizer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getCurrentOrganizer(): Promise<Organizer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const now = new Date();
  const row = await db.query.organizerSessions.findFirst({
    where: and(
      eq(organizerSessions.token, token),
      gt(organizerSessions.expiresAt, now),
    ),
  });
  if (!row) return null;

  const organizer = await db.query.organizers.findFirst({
    where: eq(organizers.id, row.organizerId),
  });
  return organizer ?? null;
}

export async function createOrganizerSession(organizerId: number) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const db = await getDb();
  await db.insert(organizerSessions).values({
    token,
    organizerId,
    expiresAt,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyOrganizerSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db
      .delete(organizerSessions)
      .where(eq(organizerSessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

export async function finishOrganizerLogin(organizerId: number, nextRaw: unknown) {
  await createOrganizerSession(organizerId);
  const next = safeNextPath(nextRaw);
  const masterToken = createdMasterToken(next);
  if (masterToken) {
    await attachCardToOrganizer(masterToken, organizerId);
  }
  return next;
}
