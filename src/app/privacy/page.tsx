import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Clock, Lock, Server, ArrowLeft, Camera, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Privacy Policy – FullPagePrint",
  description:
    "FullPagePrint's privacy policy. We do not collect, store, or transmit your screenshots. 100% on-device.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text)]">
              FullPage<span className="gradient-funky-text">Print</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 mb-3">
            <Shield className="w-3.5 h-3.5" />
            Security & Zero-Knowledge Guarantee
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="space-y-8">
          {/* TL;DR Funky Bento Card */}
          <div className="bento-card p-6 border-l-4 border-l-[var(--accent)]">
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              The FullPagePrint Guarantee
            </h2>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                <span><strong>Zero Cloud Uploads:</strong> Screenshots never leave your device. All rendering, stitching, and copying happens 100% locally.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                <span><strong>No Tracking or Telemetry:</strong> No analytics trackers, no Google Analytics, no tracking pixels, zero telemetry.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                <span><strong>10-Minute Auto-Purge:</strong> Screenshot binaries stored in <code className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] font-mono text-xs">chrome.storage.local</code> automatically self-destruct after 10 minutes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                <span><strong>Zero Account Required:</strong> No login, no email prompt, no cookies. Pure instant utility.</span>
              </li>
            </ul>
          </div>

          {[
            {
              icon: <Shield className="w-4 h-4 text-[var(--accent)]" />,
              title: "Screenshot Data & Storage",
              content: `Screenshots captured by the FullPagePrint browser extension are stored strictly in your browser's isolated local storage (chrome.storage.local). This data never leaves your device and is never transmitted to any external server or API.

The web viewer page (/capture/[id]) reads the screenshot data directly from the extension on your machine via a secure browser postMessage API — no network request transmits your image content.`,
            },
            {
              icon: <Clock className="w-4 h-4 text-[var(--accent)]" />,
              title: "Data Retention & Automatic Expiration",
              content: `Screenshot data stored locally by FullPagePrint has an automatic Time-To-Live (TTL) of 10 minutes. After this window, the capture record is automatically purged from your browser's local storage.

You can also purge extension data at any time by clearing your extension storage or removing the extension from Chrome.`,
            },
            {
              icon: <Lock className="w-4 h-4 text-[var(--accent)]" />,
              title: "Extension Permissions Explained",
              content: `The FullPagePrint extension requests only the minimum permissions required to perform its utility functions:

• activeTab – To capture the viewport of the tab you explicitly trigger
• scripting – To display the drag-to-select box and calculate scroll positions for full-page captures
• tabs – To open the local preview tab in your browser
• storage – To temporarily save the capture locally on your computer
• downloads – To save the file directly to your local Downloads folder
• offscreen – Required by Chrome Manifest V3 to perform canvas stitching operations

FullPagePrint never requests broad permissions to read browsing history or personal data.`,
            },
            {
              icon: <Server className="w-4 h-4 text-[var(--accent)]" />,
              title: "No Backend Processing",
              content: `FullPagePrint does not operate an image processing backend. The capture ID in the URL is purely a local client-side key for referencing data already stored in your browser's local sandbox.`,
            },
          ].map(({ icon, title, content }) => (
            <section key={title} className="border-t border-[var(--border)] pt-6">
              <h2 className="text-lg font-bold text-[var(--text)] mb-2.5 flex items-center gap-2">
                {icon}
                {title}
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed text-sm whitespace-pre-line">
                {content}
              </p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 px-6 text-center bg-[var(--surface)]">
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} FullPagePrint. 100% Client-Side Privacy. ·{" "}
          <Link href="/" className="text-[var(--text)] hover:underline font-semibold">
            Home
          </Link>
        </p>
      </footer>
    </div>
  );
}
