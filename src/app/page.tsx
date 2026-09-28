"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Layers,
  Crop,
  Copy,
  Download,
  Check,
  Shield,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [previewCopied, setPreviewCopied] = useState(false);
  const [previewDownloaded, setPreviewDownloaded] = useState(false);

  const handleCopyPreview = () => {
    setPreviewCopied(true);
    setTimeout(() => setPreviewCopied(false), 2200);
  };

  const handleDownloadPreview = () => {
    setPreviewDownloaded(true);
    setTimeout(() => setPreviewDownloaded(false), 2200);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FAFAF9] flex flex-col font-sans selection:bg-[#4F6EF7]/20 selection:text-white">
      {/* ─── Top Banner: Production URL note ─── */}
      <div className="border-b border-[#27272A] bg-[#141417] py-2 px-4 text-center text-xs text-[#A1A1AA]">
        <span>Web App deployed at </span>
        <a
          href="https://snapora.vercel.app"
          className="text-[#FAFAF9] font-mono hover:underline inline-flex items-center gap-1"
        >
          snapora.vercel.app
          <ExternalLink className="w-3 h-3 text-[#71717A]" />
        </a>
      </div>

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-md border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#FAFAF9] group-hover:border-[#4F6EF7]/60 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">Snapora</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#A1A1AA]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#shortcuts" className="hover:text-white transition-colors">
              Shortcuts
            </a>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setInstallModalOpen(true)}
              className="text-xs font-medium bg-[#FAFAF9] hover:bg-[#E4E4E7] text-[#111111] px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              Get the Extension
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#27272A] bg-[#141416] px-6 py-4 flex flex-col gap-4 text-sm text-[#A1A1AA]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white"
            >
              How it works
            </a>
            <a
              href="#shortcuts"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white"
            >
              Shortcuts
            </a>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white"
            >
              Privacy
            </Link>
            <div className="pt-2 border-t border-[#27272A]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setInstallModalOpen(true);
                }}
                className="w-full text-center text-xs font-medium bg-[#FAFAF9] text-[#111111] px-4 py-2.5 rounded-lg"
              >
                Get the Extension
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-6 border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] px-3 py-1 rounded-full text-xs font-medium text-[#A1A1AA] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F6EF7]" />
              <span>Capture instantly</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-white leading-[1.12] mb-5">
              Capture anything.
              <br />
              <span className="text-[#FAFAF9]">Instantly.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed max-w-xl mb-8">
              Take beautiful screenshots of any webpage with a keyboard shortcut. Copy it,
              download it, and keep moving.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10 w-full sm:w-auto">
              <button
                onClick={() => setInstallModalOpen(true)}
                className="w-full sm:w-auto bg-[#FAFAF9] hover:bg-[#E4E4E7] text-[#111111] px-5 py-3 rounded-lg font-medium text-sm transition-colors text-center shadow-sm"
              >
                Get the Extension
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto bg-[#18181B] hover:bg-[#222226] text-[#FAFAF9] border border-[#27272A] hover:border-[#3F3F46] px-5 py-3 rounded-lg font-medium text-sm transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                See how it works
                <ArrowRight className="w-4 h-4 text-[#71717A]" />
              </a>
            </div>

            {/* Hero Keyboard Shortcut Pills */}
            <div className="w-full pt-6 border-t border-[#27272A] flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-[#71717A]">
              <div className="flex items-center gap-2">
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Ctrl</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Shift</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">S</span>
                <span className="text-[#A1A1AA] ml-1">Visible</span>
              </div>
              <div className="hidden sm:block text-[#27272A]">|</div>
              <div className="flex items-center gap-2">
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Ctrl</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Shift</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">F</span>
                <span className="text-[#A1A1AA] ml-1">Full page</span>
              </div>
              <div className="hidden sm:block text-[#27272A]">|</div>
              <div className="flex items-center gap-2">
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Ctrl</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">Shift</span>
                <span className="text-[#71717A]">+</span>
                <span className="kbd-key px-1.5 py-0.5 text-[11px]">A</span>
                <span className="text-[#A1A1AA] ml-1">Selected area</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Product Visual */}
          <div className="lg:col-span-6 w-full">
            <div className="relative rounded-xl border border-[#27272A] bg-[#18181B] shadow-2xl overflow-hidden">
              {/* Browser Window Bar */}
              <div className="h-10 bg-[#141416] border-b border-[#27272A] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 ml-3 bg-[#18181B] border border-[#27272A] px-3 py-1 rounded text-[11px] font-mono text-[#71717A]">
                    <span className="text-[#4F6EF7]">https://</span>
                    <span>docs.snapora.app/overview</span>
                  </div>
                </div>

                {/* Right utility icons in mock window */}
                <div className="flex items-center gap-2 text-xs text-[#71717A]">
                  <span className="text-[11px] font-mono text-[#A1A1AA]">100%</span>
                  <div className="w-4 h-4 rounded bg-[#27272A] flex items-center justify-center text-[10px] text-white">
                    S
                  </div>
                </div>
              </div>

              {/* Web Page Mock Content Inside Browser */}
              <div className="p-6 bg-[#111111] relative select-none">
                {/* Mock Content Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#1E1E22] mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-[#18181B] border border-[#27272A] flex items-center justify-center text-xs font-semibold text-white">
                      AP
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">API Analytics & Ingestion</div>
                      <div className="text-[10px] text-[#71717A]">production-us-east-1</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#18181B] border border-[#27272A] text-[#A1A1AA]">
                      Live
                    </span>
                  </div>
                </div>

                {/* Mock Data Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3">
                    <div className="text-[11px] text-[#71717A] mb-1">Latency p99</div>
                    <div className="text-sm font-semibold text-white">18.4 ms</div>
                  </div>
                  <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3">
                    <div className="text-[11px] text-[#71717A] mb-1">Throughput</div>
                    <div className="text-sm font-semibold text-white">42,800 req/s</div>
                  </div>
                  <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-3">
                    <div className="text-[11px] text-[#71717A] mb-1">Uptime</div>
                    <div className="text-sm font-semibold text-[#22c55e]">99.995%</div>
                  </div>
                </div>

                {/* Mock Area Selection Frame */}
                <div className="relative border border-dashed border-[#4F6EF7] bg-[#4F6EF7]/5 rounded p-4 mb-4">
                  {/* Selection Dimension Badge */}
                  <div className="absolute -top-3 left-4 bg-[#4F6EF7] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-sm">
                    780 × 340 px
                  </div>

                  {/* Corner handles */}
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#4F6EF7]" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#4F6EF7]" />
                  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#4F6EF7]" />
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#4F6EF7]" />

                  {/* Inner preview card */}
                  <div className="space-y-2">
                    <div className="h-3 bg-[#27272A] rounded w-3/4" />
                    <div className="h-2.5 bg-[#1E1E22] rounded w-1/2" />
                    <div className="h-2.5 bg-[#1E1E22] rounded w-5/6" />
                  </div>
                </div>

                {/* Floating Capture Confirmation Notification (Realistic state) */}
                <div className="absolute bottom-5 right-5 bg-[#18181B] border border-[#27272A] rounded-lg px-3.5 py-2 flex items-center gap-2.5 shadow-xl">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-white">Copied & Downloaded</span>
                    <span className="text-[10px] text-[#71717A] block">snapora-2026-09-28.png</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust / Micro Section: Three Ways to Capture ─── */}
      <section id="features" className="py-20 px-6 border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block mb-2">
              Capture Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Three ways to capture
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 01 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between hover:border-[#3F3F46] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#71717A]">01</span>
                  <div className="w-8 h-8 rounded-lg bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#FAFAF9]">
                    <Monitor className="w-4 h-4 text-[#A1A1AA]" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Visible</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Capture exactly what is on your screen in an instant. Ideal for quick sharing and
                  dialog snapshots.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/70 flex items-center justify-between text-xs text-[#71717A]">
                <span>Shortcut</span>
                <span className="font-mono text-[#FAFAF9]">Ctrl + Shift + S</span>
              </div>
            </div>

            {/* Card 02 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between hover:border-[#3F3F46] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#71717A]">02</span>
                  <div className="w-8 h-8 rounded-lg bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#FAFAF9]">
                    <Layers className="w-4 h-4 text-[#A1A1AA]" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Full Page</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Capture the entire webpage from top to bottom. Automatically scrolls and stitches
                  every chunk seamlessly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/70 flex items-center justify-between text-xs text-[#71717A]">
                <span>Shortcut</span>
                <span className="font-mono text-[#FAFAF9]">Ctrl + Shift + F</span>
              </div>
            </div>

            {/* Card 03 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between hover:border-[#3F3F46] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#71717A]">03</span>
                  <div className="w-8 h-8 rounded-lg bg-[#222226] border border-[#27272A] flex items-center justify-center text-[#FAFAF9]">
                    <Crop className="w-4 h-4 text-[#A1A1AA]" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Select Area</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  Capture only the exact region you need. Drag a precision crosshair box with
                  real-time dimension measurement.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#27272A]/70 flex items-center justify-between text-xs text-[#71717A]">
                <span>Shortcut</span>
                <span className="font-mono text-[#FAFAF9]">Ctrl + Shift + A</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works: 3-step section ─── */}
      <section id="how-it-works" className="py-20 px-6 border-b border-[#27272A] bg-[#141416]/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-center max-w-xl mx-auto">
            <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block mb-2">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Zero unnecessary clicks. Everything happens in one continuous pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-start p-6 bg-[#18181B] border border-[#27272A] rounded-xl">
              <span className="text-2xl font-mono font-semibold text-[#FAFAF9] mb-3">01</span>
              <h3 className="text-base font-semibold text-white mb-1.5">Press a shortcut</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Choose your capture mode with a quick keyboard command. No menu to open first.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start p-6 bg-[#18181B] border border-[#27272A] rounded-xl">
              <span className="text-2xl font-mono font-semibold text-[#FAFAF9] mb-3">02</span>
              <h3 className="text-base font-semibold text-white mb-1.5">Snapora captures</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                The screenshot is processed instantly with native pixel density and clean rendering.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start p-6 bg-[#18181B] border border-[#27272A] rounded-xl">
              <span className="text-2xl font-mono font-semibold text-[#FAFAF9] mb-3">03</span>
              <h3 className="text-base font-semibold text-white mb-1.5">Copy & download</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                The image is automatically copied to your clipboard, saved locally, and opened in
                Snapora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Shortcut Section: Built for Speed ─── */}
      <section id="shortcuts" className="py-20 px-6 border-b border-[#27272A]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block mb-2">
              Keyboard-first
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
              Built for speed.
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Configured out of the box with ergonomic key combinations.
            </p>
          </div>

          <div className="space-y-4">
            {/* Shortcut 1 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#3F3F46] transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-white">Visible screenshot</h4>
                <p className="text-xs text-[#71717A]">Captures the active browser viewport</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="kbd-key px-2.5 py-1 text-xs">Ctrl</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">Shift</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">S</span>
              </div>
            </div>

            {/* Shortcut 2 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#3F3F46] transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-white">Full page</h4>
                <p className="text-xs text-[#71717A]">Captures the entire scrollable document</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="kbd-key px-2.5 py-1 text-xs">Ctrl</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">Shift</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">F</span>
              </div>
            </div>

            {/* Shortcut 3 */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#3F3F46] transition-colors">
              <div>
                <h4 className="text-sm font-semibold text-white">Selected area</h4>
                <p className="text-xs text-[#71717A]">Precision crosshair drag overlay</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="kbd-key px-2.5 py-1 text-xs">Ctrl</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">Shift</span>
                <span className="text-[#71717A] text-xs">+</span>
                <span className="kbd-key px-2.5 py-1 text-xs">A</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Product Preview Section ─── */}
      <section className="py-20 px-6 border-b border-[#27272A] bg-[#141416]/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block mb-2">
              Viewer Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
              Snapora Preview
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Every capture opens cleanly in the Snapora web app with one-click copy and download.
            </p>
          </div>

          {/* Interactive Preview Container */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl">
            {/* Header bar */}
            <div className="px-5 py-3.5 border-b border-[#27272A] flex items-center justify-between bg-[#141416]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27272A]" />
                </div>
                <span className="text-xs font-mono text-[#A1A1AA] ml-2">
                  snapora-capture-visible.png
                </span>
              </div>
              <span className="text-[11px] text-[#71717A] bg-[#18181B] px-2.5 py-1 rounded border border-[#27272A]">
                Visible Viewport
              </span>
            </div>

            {/* Mock Screenshot Image inside */}
            <div className="p-8 bg-[#0E0E10] flex items-center justify-center">
              <div className="w-full max-w-3xl bg-[#141417] border border-[#27272A] rounded-xl p-6 shadow-inner">
                <div className="flex items-center justify-between pb-4 border-b border-[#27272A] mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-[#4F6EF7]/20 border border-[#4F6EF7]/40 flex items-center justify-center text-[10px] text-white font-mono">
                      SP
                    </div>
                    <span className="text-xs font-medium text-white">
                      Application Performance Metrics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#71717A]">Updated 1m ago</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg">
                    <span className="text-[10px] text-[#71717A] block">CPU Usage</span>
                    <span className="text-xs font-semibold text-white">12.4%</span>
                  </div>
                  <div className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg">
                    <span className="text-[10px] text-[#71717A] block">Memory</span>
                    <span className="text-xs font-semibold text-white">4.2 GB</span>
                  </div>
                  <div className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg">
                    <span className="text-[10px] text-[#71717A] block">Requests</span>
                    <span className="text-xs font-semibold text-white">14.8k / m</span>
                  </div>
                  <div className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg">
                    <span className="text-[10px] text-[#71717A] block">Error Rate</span>
                    <span className="text-xs font-semibold text-[#22c55e]">0.00%</span>
                  </div>
                </div>
                <div className="h-16 bg-[#18181B] border border-[#27272A] rounded-lg p-3 flex items-end gap-1.5">
                  <div className="w-full bg-[#27272A] h-6 rounded-sm" />
                  <div className="w-full bg-[#27272A] h-10 rounded-sm" />
                  <div className="w-full bg-[#4F6EF7]/80 h-14 rounded-sm" />
                  <div className="w-full bg-[#27272A] h-8 rounded-sm" />
                  <div className="w-full bg-[#27272A] h-12 rounded-sm" />
                  <div className="w-full bg-[#27272A] h-9 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Actions & Metadata bar */}
            <div className="px-6 py-4 bg-[#18181B] border-t border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
                <span className="font-medium text-white text-sm">1920 × 1080</span>
                <span>·</span>
                <span>PNG</span>
                <span>·</span>
                <span className="text-[#71717A]">1.2 MB</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyPreview}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-[#27272A] bg-[#222226] hover:bg-[#2A2A2E] text-white transition-colors inline-flex items-center gap-1.5"
                >
                  {previewCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadPreview}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#FAFAF9] hover:bg-[#E4E4E7] text-[#111111] transition-colors inline-flex items-center gap-1.5"
                >
                  {previewDownloaded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#111111]" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#111111]" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Privacy Section ─── */}
      <section className="py-20 px-6 border-b border-[#27272A]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center mx-auto mb-5 text-[#4F6EF7]">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-4">
            Your screenshots stay yours.
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed mb-6">
            Screenshots may contain sensitive information. Snapora is designed to minimize
            unnecessary storage and processing. Temporary captures expire automatically according to
            the application&apos;s retention policy.
          </p>
          <div>
            <Link
              href="/privacy"
              className="text-xs text-[#FAFAF9] hover:underline underline-offset-4 font-medium inline-flex items-center gap-1"
            >
              Read our full Privacy Policy
              <ArrowRight className="w-3.5 h-3.5 text-[#71717A]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 border-b border-[#27272A] bg-[#141416]/30 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Ready to capture faster?
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed mb-8">
            Install Snapora and make screenshots a keyboard shortcut away.
          </p>
          <button
            onClick={() => setInstallModalOpen(true)}
            className="bg-[#FAFAF9] hover:bg-[#E4E4E7] text-[#111111] px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Get Snapora</span>
            <ArrowRight className="w-4 h-4 text-[#111111]" />
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-6 bg-[#111111]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#18181B] border border-[#27272A] flex items-center justify-center text-white">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                  <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                  <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                  <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-white">Snapora</span>
            </div>
            <span className="hidden sm:block text-xs text-[#27272A]">|</span>
            <span className="text-xs text-[#71717A]">Fast screenshot capture for the web.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#A1A1AA]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-[#71717A]">© 2026 Snapora</span>
          </div>
        </div>
      </footer>

      {/* ─── Extension Installation Modal ─── */}
      {installModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setInstallModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-[#71717A] hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-[#222226] border border-[#27272A] flex items-center justify-center text-white mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1.5">Get Snapora Extension</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-5">
              Snapora is currently in production development. You can load it immediately via Chrome
              Developer Mode.
            </p>

            <div className="space-y-3 bg-[#141416] border border-[#27272A] rounded-xl p-4 text-xs text-[#A1A1AA] mb-6">
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-white bg-[#222226] w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <span>
                  Open <code className="text-white font-mono">chrome://extensions</code> in your
                  browser.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-white bg-[#222226] w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <span>Toggle on Developer Mode in the top right corner.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-white bg-[#222226] w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <span>
                  Click <strong className="text-white">Load unpacked</strong> and select the{" "}
                  <code className="text-white font-mono">extension/dist</code> folder.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#71717A] pt-2 border-t border-[#27272A]">
              <span>Chrome Web Store version</span>
              <span className="bg-[#222226] text-[#A1A1AA] px-2 py-0.5 rounded font-mono text-[10px]">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
