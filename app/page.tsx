import { parseStock } from "@/lib/stock";
import { parseDesign } from "@/lib/design";
import CreateCardForm from "@/components/create-card-form";
import OrganizerBar from "@/components/organizer-bar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    recipientName?: string;
    dedication?: string;
    stock?: string;
    design?: string;
  }>;
}) {
  const { error, recipientName, dedication, stock, design } = await searchParams;
  return (
    <>
      <OrganizerBar />
      <main className="paper-home">
        <CreateCardForm
          error={error}
          initialName={recipientName}
          initialDedication={dedication}
          initialStock={parseStock(stock)}
          initialDesign={design === undefined ? "cake" : parseDesign(design)}
        />
      </main>
    </>
  );
}
