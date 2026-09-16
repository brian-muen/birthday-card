import OrganizerBar from "@/components/organizer-bar";
import ActionButton from "@/components/action-button";
import { logIn, signUp } from "@/app/actions/organizer-auth";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";
import { safeNextPath } from "@/lib/safe-next-path";
import { redirect } from "next/navigation";
import "@/app/organizer.css";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; email?: string }>;
}) {
  const { error, next, email } = await searchParams;
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
          Anyone can make a card without signing in. An account is only so you
          can find the organizer link later.
        </p>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <div className="account-split">
          <section aria-labelledby="signup-heading">
            <h2 id="signup-heading">Create an account</h2>
            <form action={signUp}>
              <input type="hidden" name="next" value={nextPath} />
              <div className="form-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  maxLength={EMAIL_MAX}
                  autoComplete="email"
                  defaultValue={email}
                  className="field"
                />
              </div>
              <div className="form-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={PASSWORD_MIN}
                  maxLength={PASSWORD_MAX}
                  autoComplete="new-password"
                  className="field"
                />
              </div>
              <ActionButton
                pendingLabel="Creating account…"
                className="ui-button ui-button-primary"
              >
                Create account
              </ActionButton>
            </form>
          </section>
          <section aria-labelledby="login-heading">
            <h2 id="login-heading">Sign in</h2>
            <form action={logIn}>
              <input type="hidden" name="next" value={nextPath} />
              <div className="form-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  maxLength={EMAIL_MAX}
                  autoComplete="email"
                  defaultValue={email}
                  className="field"
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  maxLength={PASSWORD_MAX}
                  autoComplete="current-password"
                  className="field"
                />
              </div>
              <ActionButton
                pendingLabel="Signing in…"
                className="ui-button ui-button-primary"
              >
                Sign in
              </ActionButton>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
