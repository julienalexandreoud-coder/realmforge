import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const body = VT323({
  variable: "--font-body",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "REALMFORGE — Infinite Pixel Kingdom Builder",
  description: "Tap to forge an endless pixel-art realm. Build across 8 biomes, ascend for eternal relics, and climb the global ranks. A juicy indie clicker/idle game.",
  keywords: ["pixel art game", "clicker game", "idle game", "city builder", "indie game", "realmforge"],
  authors: [{ name: "REALMFORGE" }],
  icons: {
    icon: "./realmforge-icon.png",
    apple: "./realmforge-icon.png",
  },
  openGraph: {
    title: "REALMFORGE — Infinite Pixel Kingdom Builder",
    description: "Tap to build an endless pixel realm across 8 biomes. Ascend for eternal power!",
    type: "website",
    images: ["./realmforge-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "REALMFORGE",
    description: "Infinite pixel-art kingdom builder — tap, build, ascend!",
    images: ["./realmforge-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* CrazyGames SDK v3 — loaded synchronously (no async) so it's ready
            before the game runs and CrazyGames' QA scanner can detect it.
            The SDK auto-initializes; calls are no-ops off crazygames.com. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
      </head>
      <body
        className={`${pixel.variable} ${body.variable} antialiased bg-[#0a0a1a] text-slate-100 overscroll-none`}
        style={{ fontFamily: "var(--font-body), monospace" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
