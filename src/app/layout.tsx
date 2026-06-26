import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "6304 Agent — Most Powerful GEO Agent for Web3",
  description:
    "Monitor how AI engines represent your Web3 protocol. Catch misinformation about fees, audits, and tokenomics. Become the trusted answer. The most powerful Generative Engine Optimization (GEO) agent for CEXs, DEXs, RWA, Payment, Stablecoin, and GameFi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
