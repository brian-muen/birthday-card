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
      <header className="paper-masthead">
        <p className="paper-mark">Birthday card</p>
      </header>
      <CreateCardForm
        error={error}
        initialName={recipientName}
        initialStock={parseStock(stock)}
      />
    </main>
  );
}
