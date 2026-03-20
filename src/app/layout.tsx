import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Union Games Tournament Engine",
  description: "Real-Time Tournament Tracker & Brackets",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-512x512.png",
    apple: "/icons/icon-192x192.png",
  },
};

import { MatchProvider } from "@/context/match-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MatchProvider>{children}</MatchProvider>
      </body>
    </html>
  );
}
