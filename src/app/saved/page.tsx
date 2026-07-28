import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listQrCodes } from "@/actions/qr-actions";
import { SavedQrList } from "@/components/qr/SavedQrList";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  await auth.protect();
  const qrCodes = await listQrCodes();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Generator
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span className="text-primary">Saved codes</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Saved</h1>
        <p className="text-muted-foreground">Every QR code you&apos;ve saved, ready to download again.</p>
      </div>
      <SavedQrList initialItems={qrCodes} />
    </div>
  );
}
