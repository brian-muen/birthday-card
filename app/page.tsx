import ComposeDesktop from "@/components/mail/compose-desktop";
import { DEFAULT_DESIGN, PICKER_DESIGNS, parseDesign } from "@/lib/design";
import { getCurrentOrganizer } from "@/lib/organizer-auth";
import { listSentCards } from "@/lib/sent-cards";
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
    birthday?: string;
    stock?: string;
    design?: string;
    sent?: string;
  }>;
}) {
  const { error, recipientName, birthday, stock, design, sent } = await searchParams;
  const organizer = await getCurrentOrganizer();
  const sentCards = organizer ? await listSentCards(organizer.id) : [];
  return (
    <ComposeDesktop
      signedIn={organizer != null}
      sentCards={sentCards}
      sentEmail={organizer?.email ?? ""}
      sentOpen={sent === "1"}
      error={error}
      initialName={recipientName ?? ""}
      initialBirthday={birthday ?? ""}
      initialStock={parseStock(stock)}
      initialDesign={pickerDesign(design)}
    />
  );
}
