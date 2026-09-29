"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Monitor,
  Layers,
  Crop,
  Copy,
  Download,
  Shield,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  Lock,
  Zap,
  Sliders,
  Camera,
  Check,
  Scissors,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const MODES = [
  {
    id: "fullpage" as const,
    icon: Layers,
    title: "Full Page Capture",
    shortcut: "F",
    color: "accent",
    desc: "Auto-scrolls the webpage and stitches frames into one high-resolution, pixel-perfect PNG.",
  },
  {
    id: "visible" as const,
    icon: Monitor,
    title: "Visible Viewport",
    shortcut: "S",
    color: "green",
    desc: "Captures your currently visible browser screen in under 50 milliseconds.",
  },
  {
    id: "selection" as const,
    icon: Crop,
    title: "Area Selection",
    shortcut: "A",
    color: "amber",
    desc: "Drag a precise bounding box over any element with real-time width and height readout.",
  },
];

const FEATURES = [
  {
    icon: Copy,
    color: "accent",
    title: "Native Clipboard Copy",
    desc: "Injects standard PNG image binary straight to your OS clipboard. Paste immediately into Figma, Slack, Notion, or Docs.",
    tag: "Native Binary Copy",
  },
  {
    icon: Zap,
    color: "amber",
    title: "16K Resolution Canvas",
    desc: "Dual in-memory canvas buffer handles long-scroll documentation and dashboards up to 16,384px height without crash.",
    tag: "16,384px Buffer",
  },
  {
    icon: Lock,
    color: "green",
    title: "100% Sandbox Privacy",
    desc: "Screenshots stay on your computer inside Chrome local storage. Automatically purged after 10 minutes. Zero server uploads.",
    tag: "Chrome Sandbox",
  },
  {
    icon: Sliders,
    color: "blue",
    title: "Flexible Preferences",
    desc: "Customize auto-download, toggle PNG/JPEG, embed domain names in file titles, and switch light/dark mode anytime.",
    tag: "Manifest V3 Config",
  },
];

const COMPARE = [
  ["Full Page Canvas Stitching", "✓ Instant (<1s)", "✕ Viewport only", "Slow (5–10s)"],
  ["Direct Clipboard PNG Write", "✓ Native Binary", "Manual Copy", "Requires Cloud"],
  ["Precision Area Selection", "✓ Live W × H Crop", "Basic crop", "Limited"],
  ["Light & Dark Theme Toggle", "✓ Dual Mode", "✕ Light only", "✕ Dark only"],
  ["Free & Open Utility", "✓ 100% Free Forever", "✓ Free", "✕ $8–$15 /mo"],
  ["Local Sandbox Privacy", "✓ Zero Server Uploads", "✓ Local", "✕ Transmits to Server"],
];

const COLOR_MAP: Record<string, string> = {
  accent: "var(--accent)",
  green: "var(--green)",
  amber: "var(--amber)",
  blue: "var(--blue)",
};

const BADGE_MAP: Record<string, string> = {
  accent: "badge badge-accent",
  green: "badge badge-green",
  amber: "badge badge-amber",
  blue: "badge badge-blue",
};

function PaperCutDivider({ label }: { label: string }) {
  return (
    <div className="paper-cut-divider">
      <div className="paper-cut-notch-left" />
      <div className="paper-cut-line" />
      <div className="paper-cut-badge">
        <Scissors className="w-3 h-3 text-(--accent)" />
        <span>{label}</span>
      </div>
      <div className="paper-cut-notch-right" />
    </div>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"fullpage" | "visible" | "selection">("fullpage");
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const k = e.key.toUpperCase();
        if (k === "S") { e.preventDefault(); setActiveMode("visible"); flash("S"); }
        else if (k === "F") { e.preventDefault(); setActiveMode("fullpage"); flash("F"); }
        else if (k === "A") { e.preventDefault(); setActiveMode("selection"); flash("A"); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const flash = (key: string) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 1200);
  };

  const activeInfo = MODES.find((m) => m.id === activeMode)!;

  return (
    <div className="min-h-screen bg-(--bg) text-(--text) py-4 sm:py-6 px-3 sm:px-6">

      {/* ── Announcement Bar Box ── */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="bg-(--banner-bg) text-(--banner-text) border border-(--banner-border) text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-(--banner-text) animate-pulse" />
          Extension v1.2.0 — Ultra-fast Canvas Capture Engine with Light & Dark Theme Support.
          <button onClick={() => setInstallOpen(true)} className="underline underline-offset-2 hover:opacity-90 ml-1 font-extrabold">
            Download Zip Free →
          </button>
        </div>
      </div>

      {/* ── Boxed Sticky Navbar ── */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto mb-5">
        <div className="bg-(--surface) border-2 border-(--border) shadow-md rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-(--icon-bg) border border-(--icon-border) flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4 text-(--icon-fg)" />
            </div>
            <span className="font-extrabold text-[16px] tracking-tight leading-tight text-(--text)">
              FullPagePrint
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-(--text-muted)">
            {[
              ["#modes", "Capture Modes"],
              ["#features", "Features"],
              ["#compare", "Comparison"],
              ["/privacy", "Privacy Policy"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="px-3.5 py-1.5 rounded-lg hover:bg-(--surface-hover) hover:text-(--text) transition-colors font-semibold"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" />
            <button
              id="download"
              onClick={() => setInstallOpen(true)}
              className="btn text-[13px] py-2 px-4 hidden sm:inline-flex shadow-sm bg-(--icon-bg) text-(--icon-fg) border border-(--icon-border) font-bold hover:opacity-95"
            >
              <Download className="w-3.5 h-3.5" />
              Get Extension
            </button>
            {/* Mobile */}
            <ThemeToggle className="sm:hidden" />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg border-2 border-(--border) hover:bg-(--surface-hover) md:hidden text-(--text)"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Box */}
        {mobileOpen && (
          <div className="md:hidden mt-2 border-2 border-(--border) rounded-2xl bg-(--surface) p-4 shadow-lg flex flex-col gap-1 text-[13px] font-medium animate-fadein">
            {[
              ["#modes", "Capture Modes"],
              ["#features", "Features"],
              ["#compare", "Comparison"],
              ["/privacy", "Privacy Policy"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-(--surface-hover) text-(--text-muted) hover:text-(--text) font-semibold"
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setInstallOpen(true);
              }}
              className="btn mt-2 w-full justify-center bg-(--icon-bg) text-(--icon-fg) border border-(--icon-border) font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Get Extension (.zip)
            </button>
          </div>
        )}
      </header>

      {/* ── Seamless Joined Stacked Section Boxes ── */}
      <div className="max-w-6xl mx-auto flex flex-col">

        {/* ── 1. Hero Box (Top of stack) ── */}
        <section className="bg-(--surface) border-2 border-(--border) rounded-t-2xl p-8 sm:p-14 relative overflow-hidden bg-dots text-center shadow-sm">
          <div className="absolute inset-0 bg-(--accent-light) opacity-30 pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5 text-(--text) pt-2">
              Capture any web page —<br className="hidden sm:block" />
              <span className="text-(--accent)">copied & downloaded instantly.</span>
            </h1>

            <p className="text-base sm:text-lg text-(--text-muted) max-w-xl mx-auto mb-9 leading-relaxed font-medium">
              Full-page stitching, visible viewport snapshot, or precision area selection. 
              Auto-copies high-quality PNG to clipboard and saves locally.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <button
                onClick={() => setInstallOpen(true)}
                className="btn text-sm py-3 px-6 w-full sm:w-auto shadow-md bg-(--icon-bg) text-(--banner-text) border-2 border-(--icon-border) font-bold hover:opacity-95 text-(--icon-fg)"
              >
                <Download className="w-4 h-4 text-(--icon-fg)" /> Download Extension (.zip)
              </button>
              <a
                href="#modes"
                className="btn btn-secondary text-sm py-3 px-6 w-full sm:w-auto border-2 border-(--border) font-bold text-(--text)"
              >
                Explore Capture Modes →
              </a>
            </div>

            {/* Keyboard Shortcuts Strip */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-(--kbd-bg) border-2 border-(--kbd-border) rounded-2xl px-6 py-3.5 shadow-md text-xs text-(--kbd-text)">
              {[
                { keys: ["Ctrl", "Shift", "F"], label: "Full Page", color: "var(--accent)" },
                { keys: ["Ctrl", "Shift", "S"], label: "Visible Viewport", color: "var(--accent)" },
                { keys: ["Ctrl", "Shift", "A"], label: "Area Selection", color: "var(--text-muted)" },
              ].map(({ keys, label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {keys.map((k, i) => (
                    <span
                      key={i}
                      className={`kbd bg-(--surface) text-(--text) border-(--border) ${pressedKey === k && k.length === 1 ? "opacity-50 scale-95" : ""}`}
                    >
                      {k}
                    </span>
                  ))}
                  <span className="ml-1 font-bold text-[13px]" style={{ color }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Paper Cut Seam 1 ── */}
        <PaperCutDivider label="Overview" />

        {/* ── 2. Capture Modes Box (Middle of stack) ── */}
        <section id="modes" className="bg-(--surface) border-2 border-t-0 border-(--border) p-6 sm:p-10 relative shadow-sm">
          <div className="text-center mb-10">
            <p className="section-label mb-1.5 font-black text-(--accent)">Capture Modes</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--text)">
              Three capture modes built for speed.
            </h2>
            <p className="text-sm text-(--text-muted) mt-2 font-medium">
              Use global Chrome keyboard shortcuts to trigger capture from any active tab.
            </p>
          </div>

          {/* Mode Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className={`card p-5 text-left flex flex-col gap-3 cursor-pointer transition-all duration-150 border-2 ${
                    active ? "border-(--accent) bg-(--accent-light)" : "border-(--border)"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-(--icon-bg) border border-(--icon-border) flex items-center justify-center shrink-0 shadow-sm">
                      <Icon className="w-5 h-5 text-(--icon-fg)" />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="kbd">Ctrl</span>
                      <span className="kbd">⇧</span>
                      <span className="kbd text-(--accent) border-(--accent)">
                        {m.shortcut}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-(--text) mb-1">{m.title}</h3>
                    <p className="text-xs text-(--text-muted) leading-relaxed font-medium">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Mode Banner */}
          <div
            className="border-2 border-(--banner-border) bg-(--banner-bg) text-(--banner-text) rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadein shadow-md"
            key={activeMode}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-(--surface) text-(--text) flex items-center justify-center shrink-0 shadow-md">
                <activeInfo.icon className="w-6 h-6 text-(--accent)" />
              </div>
              <div>
                <h4 className="font-bold text-base text-(--banner-text) mb-0.5">
                  {activeInfo.title} Mode Selected
                </h4>
                <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                  {activeInfo.desc}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <span className="kbd">Ctrl</span>
              <span className="kbd">Shift</span>
              <span className="kbd text-(--accent) border-(--accent)">
                {activeInfo.shortcut}
              </span>
            </div>
          </div>
        </section>

        {/* ── Paper Cut Seam 2 ── */}
        <PaperCutDivider label="Capabilities" />

        {/* ── 3. Features Box (Middle of stack) ── */}
        <section id="features" className="bg-(--surface) border-2 border-t-0 border-(--border) p-6 sm:p-10 relative shadow-sm">
          <div className="text-center mb-10">
            <p className="section-label mb-1.5 font-black text-(--accent)">Core Features</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--text)">
              Engineered for seamless everyday workflow.
            </h2>
            <p className="text-sm text-(--text-muted) mt-2 font-medium">
              No bloated cloud login. Pure browser extension utility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 flex flex-col gap-4 border-2 border-(--border)">
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-(--icon-bg) border border-(--icon-border) flex items-center justify-center shrink-0 shadow-md">
                      <Icon className="w-5 h-5 text-(--icon-fg)" />
                    </div>
                    <span className="badge bg-(--icon-bg) text-(--banner-text) border-(--icon-border)">{f.tag}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-(--text) mb-1">{f.title}</h3>
                    <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Paper Cut Seam 3 ── */}
        <PaperCutDivider label="Benchmark" />

        {/* ── 4. Compare Box (Middle of stack) ── */}
        <section id="compare" className="bg-(--surface) border-2 border-t-0 border-(--border) p-6 sm:p-10 relative shadow-sm">
          <div className="text-center mb-10">
            <p className="section-label mb-1.5 font-black text-(--accent)">Feature Comparison</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--text)">
              How FullPagePrint compares.
            </h2>
          </div>

          <div className="border-2 border-(--border) rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-(--border) bg-(--icon-bg) text-(--banner-text)">
                  <th className="py-3.5 px-5 text-left font-extrabold uppercase tracking-wider text-[11px] text-(--banner-text)">
                    Capabilities
                  </th>
                  <th className="py-3.5 px-5 text-left font-black text-(--accent) uppercase tracking-wider text-[11px]">
                    FullPagePrint
                  </th>
                  <th className="py-3.5 px-5 text-left font-bold opacity-90 uppercase tracking-wider text-[11px] hidden sm:table-cell">
                    Default OS Snipping
                  </th>
                  <th className="py-3.5 px-5 text-left font-bold opacity-90 uppercase tracking-wider text-[11px] hidden sm:table-cell">
                    Paid SaaS Extensions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-(--border) bg-(--surface)">
                {COMPARE.map(([feature, fpp, native, other]) => (
                  <tr key={feature} className="hover:bg-(--surface-hover) transition-colors">
                    <td className="py-3.5 px-5 font-bold text-(--text)">{feature}</td>
                    <td className="py-3.5 px-5 font-extrabold text-(--green) flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-(--green) shrink-0" />
                      {fpp.replace("✓ ", "")}
                    </td>
                    <td className="py-3.5 px-5 text-(--text-muted) font-medium hidden sm:table-cell">{native}</td>
                    <td className="py-3.5 px-5 text-(--text-muted) font-medium hidden sm:table-cell">{other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Paper Cut Seam 4 ── */}
        <PaperCutDivider label="Security Guarantee" />

        {/* ── 5. Privacy Guarantee Box (Middle of stack) ── */}
        <section className="bg-(--surface) border-2 border-t-0 border-(--border) p-6 sm:p-8 relative shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-(--icon-bg) border border-(--icon-border) flex items-center justify-center shrink-0 shadow-md">
                <Shield className="w-6 h-6 text-(--icon-fg)" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-(--text) mb-1">
                  Zero-Knowledge Local Storage
                </h3>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed max-w-2xl font-medium">
                  Captured images live strictly in Chrome&apos;s sandbox storage. They are auto-purged 
                  after 10 minutes and never transmitted over external network endpoints.{" "}
                  <Link href="/privacy" className="text-(--accent) font-extrabold hover:underline">
                    Read Privacy Policy →
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs shrink-0 border-t-2 md:border-t-0 md:border-l-2 border-(--border) pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              {["100% Client-side canvas", "Zero analytical telemetry", "Auto 10-min storage cleanup"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-(--text-muted)">
                  <CheckCircle2 className="w-3.5 h-3.5 text-(--accent)" />
                  <span className="font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Paper Cut Seam 5 ── */}
        <PaperCutDivider label="Extension v1.2.0" />

        {/* ── 6. Footer Box (Bottom of stack) ── */}
        <footer className="bg-(--surface) border-2 border-t-0 border-(--border) rounded-b-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-(--text-muted)">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-(--icon-bg) border border-(--icon-border) flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-(--icon-fg)" />
              </div>
              <div>
                <span className="font-bold text-(--text)">FullPagePrint</span>
                <span className="ml-2 text-[11px] font-mono text-(--text-subtle)">
                  v1.2.0 • Chrome Manifest V3
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 font-bold">
              <Link href="/privacy" className="hover:text-(--text) transition-colors">
                Privacy Policy
              </Link>
              <a
                href="https://github.com/ApnaShashank/snapora"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--text) transition-colors inline-flex items-center gap-1"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
              <span className="badge bg-(--icon-bg) text-(--icon-fg) border-(--icon-border)">
                <span className="w-1.5 h-1.5 rounded-full bg-(--icon-fg) animate-pulse" />
                100% Client-Side Engine
              </span>
            </div>
          </div>
        </footer>

      </div>

      {/* ── Install Modal ── */}
      {installOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setInstallOpen(false)}
        >
          <div className="bg-(--surface) border border-(--border) rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fadein">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg text-(--text)">Install FullPagePrint</h3>
                <p className="text-xs text-(--text-muted) mt-0.5">Chrome Extension Zip • Manifest V3 • v1.2.0</p>
              </div>
              <button
                onClick={() => setInstallOpen(false)}
                className="btn btn-ghost p-1.5 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <a
              href="/fullpageprint-extension.zip"
              download="fullpageprint-extension.zip"
              className="btn btn-primary w-full justify-center mb-5 py-3 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download fullpageprint-extension.zip
            </a>

            <div className="space-y-3 text-[13px] text-(--text-muted) pt-4 border-t border-(--border)">
              <p className="font-semibold text-(--text) text-xs uppercase tracking-wide mb-2">
                3 Steps to Load Extension
              </p>
              {[
                <>Extract <code className="font-mono text-(--text) font-semibold">fullpageprint-extension.zip</code></>,
                <>Open <code className="font-mono text-(--text) font-semibold">chrome://extensions</code> and enable <strong>Developer mode</strong></>,
                <>Click <strong>Load unpacked</strong> and select the unzipped folder</>,
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-(--accent-light) text-(--accent) font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


