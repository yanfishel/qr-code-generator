import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Space_Grotesk, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Logo } from "@/components/qr/Logo";
import { Button } from "@/components/ui/button";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const body = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qrframe.pro"),
  title: {
    default: "QRFrame — Custom QR Code Generator",
    template: "%s · QRFrame",
  },
  description:
    "Create custom QR codes for URLs, Wi-Fi, contact cards, payments, and more. Choose colors, dot styles, and logos, then download as PNG or SVG — free, no signup required to generate.",
  keywords: [
    "QR code generator",
    "custom QR code",
    "free QR code",
    "QR code with logo",
    "Wi-Fi QR code",
    "vCard QR code",
    "SVG QR code",
  ],
  applicationName: "QRFrame",
  authors: [{ name: "QRFrame" }],
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://qrframe.pro",
    siteName: "QRFrame",
    title: "QRFrame — Custom QR Code Generator",
    description:
      "Create custom QR codes for URLs, Wi-Fi, contact cards, payments, and more. Choose colors, dot styles, and logos, then download as PNG or SVG.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QRFrame — Custom QR Code Generator",
    description:
      "Create custom QR codes for URLs, Wi-Fi, contact cards, payments, and more. Free, no signup required to generate.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#101412" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", display.variable, body.variable, plexMono.variable)}
    >
      <body className="flex min-h-screen flex-col bg-page-gradient">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <TooltipProvider>
            <header className="border-b border-border/70 bg-background/80 backdrop-blur-sm">
              <nav className="mx-auto grid h-[60px] max-w-4xl grid-cols-[1fr_auto_1fr] items-center px-4">
                <Link href="/" className="flex items-center gap-2.5 justify-self-start">
                  <Logo className="size-6 text-primary" />
                  <span className="hidden font-display text-[1rem] font-semibold tracking-tight sm:inline">QR FRAME</span>
                </Link>
                <div className="flex items-center gap-7 justify-self-center">
                  <Show when="signed-in">
                    <Link
                      href="/"
                      className="font-mono text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
                    >
                      Generator
                    </Link>
                    <Link
                      href="/saved"
                      className="font-mono text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
                    >
                      Saved
                    </Link>
                  </Show>
                </div>
                <div className="flex items-center gap-3 justify-self-end">
                  <Show when="signed-out">
                    <SignInButton mode="modal">
                      <Button variant="default" size="sm">
                        Sign In
                      </Button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <UserButton />
                  </Show>
                </div>
              </nav>
            </header>
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-5 pb-10">{children}</main>
            <footer className="border-t border-border/70 bg-background/80 backdrop-blur-sm">
              <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:gap-4 sm:py-3">
                <a
                  href="https://fishart.co.il"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/fishart.png"
                    alt="FishArt"
                    width={90}
                    height={21}
                    className="h-[21px] w-auto invert opacity-60 dark:invert-0 dark:opacity-70"
                  />
                </a>
                <p className="min-w-0 text-center font-mono text-xs text-muted-foreground sm:flex-1">
                  QRFrame © {new Date().getFullYear()}. Made with <span className="text-red-500">♥</span> for the
                  web
                </p>
                <div className="flex shrink-0 items-center gap-2.5">
                  <a
                    href="mailto:yan.fishel@gmail.com?subject=QRFrame Feedback"
                    title="Send feedback"
                    className="flex size-[34px] items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted"
                  >
                    <Mail className="size-4" />
                  </a>
                  <a
                    href="https://github.com/yanfishel/qr-code-generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="QRFrame on GitHub"
                    className="flex size-[34px] items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    >
                      <path d="m5.75 14.25s-.5-2 .5-3c0 0-2 0-3.5-1.5s-1-4.5 0-5.5c-.5-1.5.5-2.5.5-2.5s1.5 0 2.5 1c1-.5 3.5-.5 4.5 0 1-1 2.5-1 2.5-1s1 1 .5 2.5c1 1 1.5 4 0 5.5s-3.5 1.5-3.5 1.5c1 1 .5 3 .5 3" />
                      <path d="m5.25 13.75c-1.5.5-3-.5-3.5-1" />
                    </svg>
                  </a>
                </div>
              </div>
            </footer>
            <Toaster />
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
