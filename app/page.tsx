import { createCard } from "@/app/actions/create-card";

const steps = [
  {
    title: "Create the card",
    body: "Add the birthday person's name. Takes about ten seconds.",
  },
  {
    title: "Share the link",
    body: "Friends add a private message. Nobody sees anyone else's note.",
  },
  {
    title: "Hand it over",
    body: "On the day, send them the card — a little book of messages.",
  },
];

const inputClass =
  "w-full rounded-md border border-foreground/20 bg-white px-3.5 py-2.5 text-base outline-none transition placeholder:text-foreground/30 focus:border-foreground/60";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    recipientName?: string;
  }>;
}) {
  const { error, recipientName } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-16 sm:py-24">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/45">
          Birthday cards, signed together
        </p>
        <h1 className="mt-6 font-serif text-4xl leading-[1.15] tracking-tight text-balance sm:text-[3.4rem]">
          The birthday card <em>everyone</em> can sign.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-foreground/60 text-balance">
          Start a card and share one link. Every message stays private until
          the birthday, then they read them all — like pages of a little book.
        </p>
      </header>

      <section className="mt-14 rounded-lg border border-foreground/12 bg-white p-6 sm:p-8">
        {error ? (
          <p
            role="alert"
            className="mb-6 border-l-2 border-foreground/60 pl-3 text-sm text-foreground/80"
          >
            {error}
          </p>
        ) : null}

        <form action={createCard} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="recipientName"
              className="text-sm font-medium text-foreground/80"
            >
              Whose birthday is it?
            </label>
            <input
              id="recipientName"
              name="recipientName"
              type="text"
              required
              maxLength={80}
              defaultValue={recipientName}
              autoComplete="off"
              placeholder="Priya"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="intro"
              className="text-sm font-medium text-foreground/80"
            >
              Welcome note{" "}
              <span className="font-normal text-foreground/45">(optional)</span>
            </label>
            <textarea
              id="intro"
              name="intro"
              rows={4}
              maxLength={500}
              placeholder="A few words your friends will see before they write their message."
              className={`${inputClass} resize-y`}
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-md bg-foreground px-6 py-3 text-base font-medium text-background transition hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Create the card
          </button>
        </form>
      </section>

      <section className="mt-14 border-t border-foreground/12 pt-8">
        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="font-serif text-2xl italic text-foreground/35">
                {index + 1}
              </p>
              <h3 className="mt-1.5 text-sm font-medium">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/55">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
