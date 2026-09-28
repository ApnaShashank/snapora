import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://snapora.vercel.app"),
  title: "Snapora — Capture Anything, Instantly",
  description:
    "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
  keywords: ["screenshot", "browser capture", "chrome extension", "full page screenshot", "screen capture utility", "snapora"],
  authors: [{ name: "Snapora" }],
  openGraph: {
    title: "Snapora — Capture Anything, Instantly",
    description: "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
    url: "https://snapora.vercel.app",
    siteName: "Snapora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snapora — Capture Anything, Instantly",
    description: "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#111111] text-[#FAFAF9] min-h-screen selection:bg-[#4F6EF7]/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
