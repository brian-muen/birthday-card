"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { notifyPasswordAccepted } from "@/lib/notify-password";
import {
  birthdayNudgeText,
  messageEveryoneExcept,
  resolveBirthdayPerson,
  signingUrl,
} from "@/lib/slack";

export async function notifySlack(formData: FormData) {
  const masterToken = String(formData.get("masterToken") ?? "").trim();
  const exclude = String(formData.get("exclude") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fail = (message: string) => {
    const params = new URLSearchParams({ slackError: message });
    redirect(`/created/${masterToken}?${params.toString()}`);
  };

  if (!masterToken) {
    fail("That card link is missing.");
  }

  const db = await getDb();
  const card = await db.query.cards.findFirst({
    where: eq(cards.masterToken, masterToken),
  });

  if (!card) {
    fail("This card was not found.");
  } else if (!notifyPasswordAccepted(password)) {
    fail("That password is wrong.");
  } else {
    try {
      const birthday = await resolveBirthdayPerson(exclude);
      const result = await messageEveryoneExcept({
        birthday,
        text: birthdayNudgeText(
          card.recipientName,
          signingUrl(card.contributeToken),
        ),
      });

      const params = new URLSearchParams({
        slackSent: String(result.sent),
        slackSkipped: result.skippedName,
      });
      if (result.failed.length > 0) {
        params.set("slackFailed", String(result.failed.length));
      }
      redirect(`/created/${masterToken}?${params.toString()}`);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      fail(
        error instanceof Error
          ? error.message
          : "Slack could not send those messages.",
      );
    }
  }
}
