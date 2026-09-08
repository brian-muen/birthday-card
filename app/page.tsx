import { parseStock } from "@/lib/stock";
import CreateCardForm from "@/components/create-card-form";

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
  return (
    <main className="paper-home">
      <header className="paper-masthead"><p className="paper-mark">A little something in the post</p><p className="paper-purpose">Birthday cards, gathered by hand</p></header>
      <div className="paper-home-grid">
        <div className="paper-introduction"><p className="paper-kicker">For the person who has everything</p><h1>A birthday card everyone signs.</h1><p className="paper-lede">Start one card, share one link, and gather the good stuff in one place. Each person writes privately, so every note still feels like a small surprise.</p><CreateCardForm error={error} initialName={recipientName} initialStock={parseStock(stock)} /></div>
        <aside className="paper-preview-column" aria-label="Card preview"><p className="preview-label">The finished card</p><div className="preview-rule" /><p className="preview-caption">A quiet place for everyone&apos;s words.</p></aside>
      </div>
      <section className="paper-process" aria-label="How it works"><div><span className="process-number">01</span><h2>Start with a name</h2><p>Choose the paper and add a short note for the people signing.</p></div><div><span className="process-number">02</span><h2>Pass around one link</h2><p>Everyone adds their own message without seeing other notes.</p></div><div><span className="process-number">03</span><h2>Share the card</h2><p>When it&apos;s ready, send the recipient their private card link.</p></div></section>
    </main>
  );
}
