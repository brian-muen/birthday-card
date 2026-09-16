import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { organizers } from "@/lib/db/schema";

export async function upsertOrganizerFromGoogle(googleSub: string, email: string) {
  const db = await getDb();
  const bySub = await db.query.organizers.findFirst({
    where: eq(organizers.googleSub, googleSub),
  });
  if (bySub) {
    if (bySub.email !== email) {
      await db
        .update(organizers)
        .set({ email })
        .where(eq(organizers.id, bySub.id));
    }
    return bySub.id;
  }

  const byEmail = await db.query.organizers.findFirst({
    where: eq(organizers.email, email),
  });
  if (byEmail) {
    await db
      .update(organizers)
      .set({ googleSub, email })
      .where(eq(organizers.id, byEmail.id));
    return byEmail.id;
  }

  const [created] = await db
    .insert(organizers)
    .values({ googleSub, email })
    .returning({ id: organizers.id });
  if (!created) {
    throw new Error("Could not create organizer");
  }
  return created.id;
}
