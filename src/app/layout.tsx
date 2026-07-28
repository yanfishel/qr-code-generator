import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Space_Grotesk, Work_Sans, IBM_Plex_Mono } from "next/font/google";
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
  title: "QRFrame",
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
      <body className="bg-page-gradient">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <TooltipProvider>
            <header className="border-b border-border/70 bg-background/80 backdrop-blur-sm">
              <nav className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4">
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
            <main className="mx-auto max-w-4xl px-4 pt-5 pb-10">{children}</main>
            <Toaster />
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
