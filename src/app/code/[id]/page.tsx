import { notFound } from "next/navigation";
import { getPublicQrCode } from "@/actions/qr-actions";
import { PublicQrView } from "@/components/qr/PublicQrView";
import { qrTypeLabels } from "@/lib/qr-schema";

export const dynamic = "force-dynamic";

type PublicQrCodePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicQrCodePage({ params }: PublicQrCodePageProps) {
  const { id } = await params;
  const qrCode = await getPublicQrCode(id);
  if (!qrCode) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">QR Code</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {qrCode.name || qrTypeLabels[qrCode.type]}
        </h1>
      </div>
      <PublicQrView qrCode={qrCode} />
    </div>
  );
}
