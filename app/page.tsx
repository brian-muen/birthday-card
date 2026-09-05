import { createCard } from "@/app/actions/create-card";
import { DEFAULT_STOCK, STOCKS, parseStock } from "@/lib/stock";

// Sample pages for the hero: the product is a card full of other people's
// handwriting, so the clearest thing to show is the card itself.
const samplePages = [
  {
    body: "You talked me into that 6am hike and I've never been so glad to lose an argument.",
    author: "Nadia",
  },
  {
    body: "Fourteen years of you making everyone in the room feel like the interesting one.",
    author: "Theo",
  },
];

const flow = [
  {
    title: "Create the card",
    body: "Add the birthday person's name. It takes about ten seconds.",
  },
  {
    title: "Share the link",
    body: "Everyone writes their own message and can't read anyone else's.",
  },
  {
    title: "Hand it over",
    body: "Send the card on the day. They open it and read every note.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    recipientName?: string;
    stock?: string;
  }>;
}) {
  const { error, recipientName, stock } = await searchParams;
  const selectedStock = parseStock(stock || DEFAULT_STOCK);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:py-24">
      <div className="grid items-start gap-16 lg:grid-cols-[1fr_24rem] lg:gap-20">
        <div>
          <h1 className="max-w-[19ch] font-serif text-[2.75rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.5rem]">
            A birthday card everyone signs.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted">
            Start a card and share one link. Every message stays hidden until
            the day you hand it over, then they open the card and read every
            note.
          </p>

          <form action={createCard} className="mt-12 max-w-md">
            {error ? (
              <p
                role="alert"
                className="mb-8 border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-8">
              <div>
                <label
                  htmlFor="recipientName"
                  className="block text-[0.9375rem] font-medium"
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
                  className="field mt-2.5 font-serif text-xl"
                />
              </div>

              <fieldset>
                <legend className="text-[0.9375rem] font-medium">
                  Paper
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {STOCKS.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer flex-col items-center gap-1.5"
                    >
                      <input
                        type="radio"
                        name="stock"
                        value={option.id}
                        defaultChecked={option.id === selectedStock}
                        className="peer sr-only"
                      />
                      <span
                        className="block size-10 border border-rule peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-checked:outline peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-ink"
                        style={{ backgroundColor: option.hex }}
                      />
                      <span className="text-[0.75rem] text-muted">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="intro"
                  className="block text-[0.9375rem] font-medium"
                >
                  A note for the people signing{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="intro"
                  name="intro"
                  rows={3}
                  maxLength={500}
                  className="field mt-2.5 resize-y font-serif text-lg leading-relaxed"
                />
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  They&rsquo;ll read this before they write, so tell them
                  what the card is for.
                </p>
              </div>

              <button
                type="submit"
                className="self-start bg-ink px-7 py-3 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-[#121a31]"
              >
                Create the card
              </button>
            </div>
          </form>
        </div>

        {/* Two message pages, slightly offset, as they'd sit on a desk. */}
        <div aria-hidden className="relative hidden lg:block">
          <div className="absolute -right-3 top-4 h-full w-full rotate-[1.5deg] border border-rule bg-raised" />
          <div className="paper-lift relative border border-rule bg-raised px-9 py-10">
            {samplePages.map((page, index) => (
              <div
                key={page.author}
                className={
                  index > 0 ? "mt-8 border-t border-rule pt-8" : undefined
                }
              >
                <p className="font-serif text-[1.375rem] leading-[1.55]">
                  {page.body}
                </p>
                <p className="mt-4 text-right font-hand text-[1.75rem] leading-none text-ink/80">
                  {page.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ol className="mt-24 grid gap-10 border-t border-rule pt-10 sm:grid-cols-3 sm:gap-12">
        {flow.map((step, index) => (
          <li key={step.title}>
            <p className="font-serif text-[0.9375rem] text-brass tabular-nums">
              {index + 1}
            </p>
            <h2 className="mt-2 text-[0.9375rem] font-medium">{step.title}</h2>
            <p className="mt-1.5 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
