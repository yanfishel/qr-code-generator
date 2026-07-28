import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getQrCode } from "@/actions/qr-actions";
import { QrGeneratorForm } from "@/components/qr/QrGeneratorForm";

export const dynamic = "force-dynamic";

type EditQrCodePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQrCodePage({ params }: EditQrCodePageProps) {
  await auth.protect();
  const { id } = await params;
  const qrCode = await getQrCode(id);
  if (!qrCode) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">Edit</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {qrCode.name || "Edit QR code"}
        </h1>
        <p className="text-muted-foreground">Update the content or style, then save your changes.</p>
      </div>
      <QrGeneratorForm mode="edit" qrCode={qrCode} />
    </div>
  );
}
