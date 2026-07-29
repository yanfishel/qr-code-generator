import { QrGeneratorForm } from "@/components/qr/QrGeneratorForm";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QRFrame",
  url: "https://qrframe.pro",
  description: "Create custom QR codes for URLs, Wi-Fi, contact cards, payments, and more.",
  applicationCategory: "Utility",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Home() {
  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-2 border-b border-border pb-4">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">
          Generate · Customize · Scan
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Make a QR code that looks like it&apos;s yours
        </h1>
        <p className="text-muted-foreground">
          Set the colors, size, and error correction, drop in a logo, then download the PNG or
          save it for later.
        </p>
      </div>
      <QrGeneratorForm />
    </div>
  );
}
