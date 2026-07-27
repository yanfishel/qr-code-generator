import { QrGeneratorForm } from "@/components/qr/QrGeneratorForm";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">
          Generate · Customize · Scan
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Make a QR code that looks like it&apos;s yours
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Set the colors, size, and error correction, drop in a logo, then download the PNG or
          save it for later.
        </p>
      </div>
      <QrGeneratorForm />
    </div>
  );
}
