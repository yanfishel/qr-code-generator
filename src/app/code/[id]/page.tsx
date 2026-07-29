import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicQrCode } from "@/actions/qr-actions";
import { PublicQrView } from "@/components/qr/PublicQrView";
import { qrTypeLabels } from "@/lib/qr-schema";

export const dynamic = "force-dynamic";

type PublicQrCodePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PublicQrCodePageProps): Promise<Metadata> {
  const { id } = await params;
  const qrCode = await getPublicQrCode(id);
  if (!qrCode) return {};

  const title = qrCode.name || `${qrTypeLabels[qrCode.type]} QR Code`;
  const description = `Scan or download this ${qrTypeLabels[qrCode.type]} QR code, made with QRFrame.`;
  return {
    title,
    description,
    alternates: { canonical: `/code/${id}` },
    openGraph: { title, description, url: `/code/${id}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

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
