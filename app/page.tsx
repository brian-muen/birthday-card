import { parseStock } from "@/lib/stock";
import { DEFAULT_DESIGN, parseDesign } from "@/lib/design";
import CreateCardForm from "@/components/create-card-form";
import OrganizerBar from "@/components/organizer-bar";

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
    <>
      <OrganizerBar />
      <main className="home-page">
        <CreateCardForm
          error={error}
          initialName={recipientName}
          initialStock={parseStock(stock)}
          initialDesign={design === undefined ? DEFAULT_DESIGN : parseDesign(design)}
        />
      </main>
    </>
  );
}
