import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Generate and save customizable QR codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4">
            <span className="font-semibold">QR Code Generator</span>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Generator
            </Link>
            <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground">
              History
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
