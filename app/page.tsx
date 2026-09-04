import { createCard } from "@/app/actions/create-card";

const steps = [
  {
    title: "Create the card",
    body: "Name the recipient and the occasion. Takes about ten seconds.",
  },
  {
    title: "Share the contributor link",
    body: "Friends add a private message. Nobody sees anyone else's note.",
  },
  {
    title: "Send it over",
    body: "When it's full of love, hand the master link to someone special.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    recipientName?: string;
    occasion?: string;
  }>;
}) {
  const { error, recipientName, occasion } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-5 py-12 sm:px-8 sm:py-20">
      <section className="flex flex-col gap-5 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase sm:mx-0">
          Group cards, no accounts
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Create a group card, collect heartfelt messages, send it to someone
          special.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-balance text-amber-950/70 sm:mx-0">
          Start a card, share one link with friends, and every message stays
          private until you send the finished card to the recipient.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5 sm:p-8">
        <h2 className="text-xl font-semibold">Start a card</h2>
        <p className="mt-1 text-sm text-amber-950/60">
          You&rsquo;ll get a link to share and a private link to keep.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"
          >
            {error}
          </p>
        ) : null}

        <form action={createCard} className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="recipientName"
              className="text-sm font-medium text-amber-950"
            >
              Who is it for?
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
              className="rounded-xl border border-amber-900/15 bg-[#fffdfa] px-4 py-3 text-base outline-none placeholder:text-amber-950/35 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="occasion"
              className="text-sm font-medium text-amber-950"
            >
              What&rsquo;s the occasion?
            </label>
            <input
              id="occasion"
              name="occasion"
              type="text"
              required
              maxLength={60}
              defaultValue={occasion}
              autoComplete="off"
              placeholder="Birthday"
              className="rounded-xl border border-amber-900/15 bg-[#fffdfa] px-4 py-3 text-base outline-none placeholder:text-amber-950/35 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
            <p className="text-xs text-amber-950/55">
              Birthday, farewell, new baby, thank you &mdash; anything goes.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="intro"
              className="text-sm font-medium text-amber-950"
            >
              Welcome note{" "}
              <span className="font-normal text-amber-950/50">(optional)</span>
            </label>
            <textarea
              id="intro"
              name="intro"
              rows={4}
              maxLength={500}
              placeholder="A few words your friends will see before they write their message."
              className="resize-y rounded-xl border border-amber-900/15 bg-[#fffdfa] px-4 py-3 text-base outline-none placeholder:text-amber-950/35 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-rose-500/20 transition hover:from-rose-600 hover:to-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            Create the card
          </button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl bg-white/70 p-5 ring-1 ring-amber-900/5"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-amber-950/65">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
