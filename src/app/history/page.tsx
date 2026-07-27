import { auth } from "@clerk/nextjs/server";
import { listQrCodes } from "@/actions/qr-actions";
import { SavedQrList } from "@/components/qr/SavedQrList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  await auth.protect();
  const qrCodes = await listQrCodes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-muted-foreground">Your saved QR codes.</p>
      </div>
      <SavedQrList initialItems={qrCodes} />
    </div>
  );
}
