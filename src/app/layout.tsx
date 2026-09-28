import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Capture – Screenshot Tool",
  description:
    "Capture screenshots with keyboard shortcuts. Instantly copy, download, and preview in your browser.",
  keywords: ["screenshot", "capture", "chrome extension", "screenshot tool"],
  openGraph: {
    title: "Capture – Screenshot Tool",
    description: "Capture screenshots with keyboard shortcuts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#0a0c14] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
