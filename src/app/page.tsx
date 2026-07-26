import { QrGeneratorForm } from "@/components/qr/QrGeneratorForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Generate a QR code</h1>
        <p className="text-muted-foreground">
          Customize the colors, size, and error correction, optionally add a logo, then download
          or save it.
        </p>
      </div>
      <QrGeneratorForm />
    </div>
  );
}
