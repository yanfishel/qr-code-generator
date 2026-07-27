import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Space_Grotesk, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/qr/Logo";

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
  title: "QR Code Generator",
  description: "Generate and save customizable QR codes",
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
      <body className="bg-dot-grid">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="border-b border-border/70 bg-background/80 backdrop-blur-sm">
            <nav className="mx-auto flex max-w-4xl items-center gap-7 px-4 py-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo className="size-6 text-primary" />
                <span className="font-display text-[0.95rem] font-semibold tracking-tight">
                  QR Code Generator
                </span>
              </Link>
              <Link
                href="/"
                className="font-mono text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
              >
                Generator
              </Link>
              <Link
                href="/history"
                className="font-mono text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
              >
                History
              </Link>
              <div className="ml-auto flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton />
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
