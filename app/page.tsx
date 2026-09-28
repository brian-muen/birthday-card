import ComposeDesktop from "@/components/mail/compose-desktop";
import { DEFAULT_DESIGN, PICKER_DESIGNS, parseDesign } from "@/lib/design";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { parseStock } from "@/lib/stock";

function pickerDesign(value: string | undefined) {
  const id = parseDesign(value);
  return PICKER_DESIGNS.some((option) => option.id === id) ? id : DEFAULT_DESIGN;
}

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
  const organizer = await getCurrentOrganizer();
  return (
    <ComposeDesktop
      signedIn={organizer != null}
      error={error}
      initialName={recipientName ?? ""}
      initialStock={parseStock(stock)}
      initialDesign={pickerDesign(design)}
    />
  );
}
