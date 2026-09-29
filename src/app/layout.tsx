import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fullpageprint.vercel.app"),
  title: "FullPagePrint — Capture Anything, Instantly",
  description:
    "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
  keywords: ["screenshot", "browser capture", "chrome extension", "full page screenshot", "screen capture utility", "fullpageprint"],
  authors: [{ name: "FullPagePrint" }],
  openGraph: {
    title: "FullPagePrint — Capture Anything, Instantly",
    description: "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
    url: "https://fullpageprint.vercel.app",
    siteName: "FullPagePrint",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FullPagePrint — Capture Anything, Instantly",
    description: "Fast browser screenshots. Capture visible screens, full webpages, or selected areas with a shortcut. Copy and download instantly.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body className="antialiased bg-(--bg) text-(--text) min-h-screen transition-colors duration-200 selection:bg-(--accent)/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
