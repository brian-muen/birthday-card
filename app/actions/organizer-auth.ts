"use server";

import { redirect } from "next/navigation";

import {
  destroyOrganizerSession,
  finishOrganizerLogin,
  getCurrentOrganizer,
} from "@/lib/organizer-auth";
import { getDb } from "@/lib/db";
import { organizers } from "@/lib/db/schema";
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  hashPassword,
  parseEmail,
  verifyPassword,
} from "@/lib/password";
import { safeNextPath } from "@/lib/safe-next-path";
import { eq } from "drizzle-orm";

function accountFail(message: string, nextRaw: unknown, email = ""): never {
  const params = new URLSearchParams({ error: message });
  const next = safeNextPath(nextRaw);
  if (next !== "/cards") params.set("next", next);
  if (email) params.set("email", email.slice(0, EMAIL_MAX));
  redirect(`/account?${params.toString()}`);
}

function readPassword(formData: FormData): string {
  return String(formData.get("password") ?? "");
}

export async function signUp(formData: FormData) {
  if (await getCurrentOrganizer()) {
    redirect(safeNextPath(formData.get("next")));
  }

  const email = parseEmail(formData.get("email"));
  const password = readPassword(formData);
  const next = formData.get("next");

  if (!email) {
    accountFail("Use a real email address.", next);
  }
  if (password.length < PASSWORD_MIN) {
    accountFail(
      `Password must be at least ${PASSWORD_MIN} characters.`,
      next,
      email,
    );
  }
  if (password.length > PASSWORD_MAX) {
    accountFail(
      `Password must be ${PASSWORD_MAX} characters or fewer.`,
      next,
      email,
    );
  }

  const db = await getDb();
  const existing = await db.query.organizers.findFirst({
    where: eq(organizers.email, email),
  });
  if (existing) {
    accountFail("An account with that email already exists. Sign in instead.", next, email);
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(organizers)
    .values({ email, passwordHash })
    .returning({ id: organizers.id });

  if (!created) {
    accountFail("Could not create the account. Try again.", next, email);
  }

  redirect(await finishOrganizerLogin(created.id, next));
}

export async function logIn(formData: FormData) {
  if (await getCurrentOrganizer()) {
    redirect(safeNextPath(formData.get("next")));
  }

  const email = parseEmail(formData.get("email"));
  const password = readPassword(formData);
  const next = formData.get("next");

  if (!email || password.length < 1 || password.length > PASSWORD_MAX) {
    accountFail("Email or password is wrong.", next, email ?? "");
  }

  const db = await getDb();
  const organizer = await db.query.organizers.findFirst({
    where: eq(organizers.email, email),
  });
  if (!organizer || !(await verifyPassword(password, organizer.passwordHash))) {
    accountFail("Email or password is wrong.", next, email);
  }

  redirect(await finishOrganizerLogin(organizer.id, next));
}

export async function logOut() {
  await destroyOrganizerSession();
  redirect("/");
}
