import { parseStock } from "@/lib/stock";
import { parseDesign } from "@/lib/design";
import CreateCardForm from "@/components/create-card-form";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    recipientName?: string;
    stock?: string;
    design?: string;
  }>;
}) {
  const { error, recipientName, stock, design } = await searchParams;
  return (
    <main className="paper-home">
      <CreateCardForm
        error={error}
        initialName={recipientName}
        initialStock={parseStock(stock)}
        initialDesign={design === undefined ? "cake" : parseDesign(design)}
      />
    </main>
  );
}
