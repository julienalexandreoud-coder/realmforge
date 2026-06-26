import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism Smash — Addictive Crystal Clicker",
  description: "Smash glowing crystals, build insane combos, reforge for eternal power, and climb the global leaderboard. A juicy clicker/idle game.",
  keywords: ["clicker game", "idle game", "addictive game", "crystal smash", "prism smash", "browser game"],
  authors: [{ name: "Prism Smash" }],
  openGraph: {
    title: "Prism Smash — Addictive Crystal Clicker",
    description: "Smash crystals, build combos, reforge for power. Can you top the leaderboard?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism Smash",
    description: "Addictive crystal clicker — smash, combo, reforge!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#05070f] text-slate-100 overscroll-none`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
