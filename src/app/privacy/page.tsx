import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Clock, Lock, Server, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy – Snapora",
  description:
    "Snapora's privacy policy. We do not collect, store, or transmit your screenshots.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#FAFAF9] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#27272A] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#FAFAF9] group-hover:border-[#4F6EF7]/50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3"/>
                <path d="M16 4h3a1 1 0 0 1 1 1v3"/>
                <path d="M20 16v3a1 1 0 0 1-1 1h-3"/>
                <path d="M8 20H5a1 1 0 0 1-1-1v-3"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-white">Snapora</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[#4F6EF7] text-xs font-medium uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            Security & Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-[#A1A1AA]">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        <div className="space-y-8">
          {/* TL;DR */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4F6EF7]" />
              The Summary
            </h2>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li className="flex items-start gap-2.5"><span className="text-[#22c55e] font-semibold mt-0.5">✓</span> Screenshots never leave your device. There are zero cloud uploads.</li>
              <li className="flex items-start gap-2.5"><span className="text-[#22c55e] font-semibold mt-0.5">✓</span> No analytics, no tracking pixels, no telemetry collected.</li>
              <li className="flex items-start gap-2.5"><span className="text-[#22c55e] font-semibold mt-0.5">✓</span> Screenshot data is stored in your browser&apos;s local storage with a 10-minute automatic expiration.</li>
              <li className="flex items-start gap-2.5"><span className="text-[#22c55e] font-semibold mt-0.5">✓</span> We collect zero personal information.</li>
            </ul>
          </div>

          {[
            {
              icon: <Shield className="w-4 h-4 text-[#4F6EF7]" />,
              title: "Screenshot Data & Storage",
              content: `Screenshots captured by the Snapora browser extension are stored strictly in your browser's isolated local storage (chrome.storage.local). This data never leaves your device and is never transmitted to any external server.

The web viewer page (snapora.vercel.app/capture/[id]) reads the screenshot data directly from the extension on your machine via a secure browser postMessage API — no network request transmits your image content.`,
            },
            {
              icon: <Clock className="w-4 h-4 text-[#4F6EF7]" />,
              title: "Data Retention & Automatic Expiration",
              content: `Screenshot data stored locally by Snapora has an automatic Time-To-Live (TTL) of 10 minutes. After this window, the capture record is automatically purged from your browser's local storage.

You can also purge extension data at any time by clearing your extension storage or removing the extension from Chrome.`,
            },
            {
              icon: <Lock className="w-4 h-4 text-[#4F6EF7]" />,
              title: "Extension Permissions",
              content: `The Snapora extension requests only the minimum permissions required to perform its utility functions:

• activeTab – To capture the viewport of the tab you explicitly trigger
• scripting – To display the drag-to-select box and calculate scroll positions for full-page captures
• tabs – To open the local preview tab in your browser
• storage – To temporarily save the capture locally on your computer
• downloads – To save the file directly to your local Downloads folder
• offscreen – Required by Chrome Manifest V3 to perform system clipboard writes and canvas operations

Snapora never requests broad permissions to read browsing history or personal data.`,
            },
            {
              icon: <Server className="w-4 h-4 text-[#4F6EF7]" />,
              title: "No Backend Processing",
              content: `Snapora does not operate an image processing backend. The capture ID in the URL is purely a local client-side key for referencing data already stored in your browser's local sandbox.`,
            },
          ].map(({ icon, title, content }) => (
            <section key={title} className="border-t border-[#27272A] pt-6">
              <h2 className="text-lg font-semibold text-white mb-2.5 flex items-center gap-2">
                {icon}
                {title}
              </h2>
              <p className="text-[#A1A1AA] leading-relaxed text-sm whitespace-pre-line">
                {content}
              </p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#27272A] py-6 px-6 text-center">
        <p className="text-xs text-[#71717A]">
          © {new Date().getFullYear()} Snapora. All rights reserved. ·{" "}
          <Link href="/" className="text-[#FAFAF9] hover:underline">
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
