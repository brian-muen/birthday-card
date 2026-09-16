import OrganizerBar from "@/components/organizer-bar";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { safeNextPath } from "@/lib/safe-next-path";
import { redirect } from "next/navigation";
import "@/app/organizer.css";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextPath = safeNextPath(next);
  if (await getCurrentOrganizer()) {
    redirect(nextPath);
  }

  return (
    <>
      <OrganizerBar />
      <main className="account-page">
        <h1>Keep the cards you start</h1>
        <p className="account-lede">
          Anyone can make a card without signing in. Google is only so you can
          find the organizer link later.
        </p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <form action="/api/auth/google" method="get" className="account-google">
          <input type="hidden" name="next" value={nextPath} />
          <button type="submit" className="ui-button ui-button-primary">
            Continue with Google
          </button>
        </form>
      </main>
    </>
  );
}
