import { auth } from "@clerk/nextjs/server";
import { listQrCodes } from "@/actions/qr-actions";
import { SavedQrList } from "@/components/qr/SavedQrList";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  await auth.protect();
  const qrCodes = await listQrCodes();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">Saved codes</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Saved</h1>
        <p className="text-muted-foreground">Every QR code you&apos;ve saved, ready to download again.</p>
      </div>
      <SavedQrList initialItems={qrCodes} />
    </div>
  );
}
