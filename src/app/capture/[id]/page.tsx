"use client";

/**
 * /capture/[id] page - FullPagePrint Studio
 *
 * This page receives a screenshot from the Chrome extension via:
 * 1. The extension injects content/bridge.js into this page
 * 2. bridge.js reads the capture record from chrome.storage.local
 * 3. bridge.js posts { source: 'capture-extension', type: 'CAPTURE_BRIDGE_DATA', record } to window
 * 4. This page listens for that message and renders the screenshot in full high-fidelity
 *
 * Features:
 * - Ultra-high image quality inspection (Fit to view, Zoom In / Out, 100% 1:1 view)
 * - Funky modern aesthetic with dual Light & Dark mode support
 * - Fast Instant Copy with tactile feedback & Fast Instant Download
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Camera,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Monitor,
  Layers,
  Crop,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ArrowLeft,
  FileImage,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CaptureRecord {
  id: string;
  dataUrl: string;
  filename: string;
  width: number;
  height: number;
  mode: "visible" | "fullpage" | "selection";
  url: string;
  timestamp: number;
  expiresAt: number;
}

type PageState =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "loaded"; record: CaptureRecord }
  | { status: "expired" }
  | { status: "no-extension" }
  | { status: "error"; message: string };

const MODE_CONFIG = {
  visible: {
    icon: Monitor,
    label: "Visible Viewport",
    colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
  fullpage: {
    icon: Layers,
    label: "Full Page Capture",
    colorClass: "bg-violet-500/10 text-violet-500 border-violet-500/30",
  },
  selection: {
    icon: Crop,
    label: "Area Selection",
    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
};

function formatFileSize(dataUrl: string): string {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Math.round((base64.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function ensurePngBlob(dataUrl: string): Promise<Blob> {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  if (mime === "image/png") {
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: "image/png" });
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(dataUrlToBlob(dataUrl));
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob ?? dataUrlToBlob(dataUrl));
      }, "image/png");
    };
    img.onerror = () => resolve(dataUrlToBlob(dataUrl));
    img.src = dataUrl;
  });
}

export default function CapturePage() {
  const params = useParams();
  const captureId = params?.id as string;

  const [state, setState] = useState<PageState>(
    captureId ? { status: "loading" } : { status: "waiting" }
  );
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "done">("idle");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fitMode, setFitMode] = useState<"fit" | "custom">("fit");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!captureId) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const handleMessage = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "capture-extension"
      )
        return;

      if (event.data?.type === "CAPTURE_BRIDGE_DATA") {
        const { record, error, expired } = event.data;

        if (record) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (pollInterval) clearInterval(pollInterval);
          setState({ status: "loaded", record });
          return;
        }

        if (expired) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (pollInterval) clearInterval(pollInterval);
          setState({ status: "expired" });
          return;
        }

        if (error) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (pollInterval) clearInterval(pollInterval);
          setState({ status: "error", message: error });
          return;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial request to bridge script
    window.postMessage({ source: "capture-webapp", type: "REQUEST_CAPTURE_DATA", id: captureId }, "*");

    // Staggered polling every 150ms for up to 10 seconds to guarantee handshake
    pollInterval = setInterval(() => {
      window.postMessage({ source: "capture-webapp", type: "REQUEST_CAPTURE_DATA", id: captureId }, "*");
    }, 150);

    timeoutRef.current = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      setState((s) => {
        if (s.status === "loading") return { status: "no-extension" };
        return s;
      });
    }, 10000);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [captureId]);

  const handleCopy = useCallback(async () => {
    if (state.status !== "loaded") return;
    setCopyState("copying");
    try {
      const pngBlob = await ensurePngBlob(state.record.dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [state]);

  const handleDownload = useCallback(() => {
    if (state.status !== "loaded") return;
    const a = document.createElement("a");
    a.href = state.record.dataUrl;
    a.download = state.record.filename;
    a.click();
    setDownloadState("done");
    setTimeout(() => setDownloadState("idle"), 2500);
  }, [state]);

  const handleZoomIn = () => {
    setFitMode("custom");
    setZoomLevel((prev) => Math.min(prev + 25, 250));
  };

  const handleZoomOut = () => {
    setFitMode("custom");
    setZoomLevel((prev) => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setFitMode("fit");
    setZoomLevel(100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-(--bg) text-(--text) transition-colors duration-200">
      {/* Header Studio Navbar */}
      <header className="sticky top-0 z-40 border-b border-(--border) bg-(--surface)/90 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 p-1.5 rounded-lg border border-(--border) hover:border-(--accent) bg-(--surface-hover) transition-all group"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4 text-(--text-muted) group-hover:text-(--text) transition-colors" />
            </Link>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-(--primary) to-(--accent) flex items-center justify-center text-white shadow-sm">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-(--text)">
                  FullPage<span className="gradient-funky-text">Print</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-(--accent)/15 text-(--accent) border border-(--accent)/30">
                  <Sparkles className="w-2.5 h-2.5" /> Studio
                </span>
              </div>
            </Link>
          </div>

          {state.status === "loaded" && (
            <div className="hidden md:flex items-center gap-2">
              {(() => {
                const config = MODE_CONFIG[state.record.mode] || MODE_CONFIG.visible;
                const IconComponent = config.icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.colorClass}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                );
              })()}

              <span className="text-xs text-(--text-muted) px-2 py-1 rounded-md bg-(--surface-hover) border border-(--border)">
                {formatTimestamp(state.record.timestamp)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {state.status === "loaded" && (
              <>
                <button
                  id="btn-copy-image"
                  onClick={handleCopy}
                  disabled={copyState === "copying"}
                  className={`btn-funky-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5 ${
                    copyState === "done" ? "border-emerald-500 text-emerald-500" : ""
                  }`}
                >
                  {copyState === "done" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : copyState === "error" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>Failed</span>
                    </>
                  ) : copyState === "copying" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-(--accent)" />
                      <span>Copying…</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-download-image"
                  onClick={handleDownload}
                  className="btn-funky-primary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5"
                >
                  {downloadState === "done" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Waiting / Loading state */}
        {(state.status === "waiting" || state.status === "loading") && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-(--primary) to-(--accent) flex items-center justify-center text-white shadow-lg animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-(--surface) p-1 rounded-full border border-(--border)">
                <Loader2 className="w-4 h-4 text-(--accent) animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-(--text)">Loading High-Res Capture…</h3>
              <p className="text-sm text-(--text-muted) mt-1">
                Reading lossless pixels from your local extension storage.
              </p>
            </div>
          </div>
        )}

        {/* Extension Not Detected */}
        {state.status === "no-extension" && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-(--surface-hover) border border-(--border) flex items-center justify-center text-(--text-muted) shadow-inner">
              <Camera className="w-8 h-8 text-(--accent)" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-(--text) mb-2">Extension Not Detected</h2>
              <p className="text-sm text-(--text-muted) leading-relaxed">
                FullPagePrint requires the Chrome extension to safely render screenshots from your
                browser sandbox. Please install and load the extension in Chrome.
              </p>
            </div>
            <Link href="/#download-banner" className="btn-funky-primary text-sm py-2.5 px-6">
              Get Extension (.zip)
            </Link>
          </div>
        )}

        {/* Expired state */}
        {state.status === "expired" && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Clock className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-(--text) mb-2">Screenshot Expired</h2>
              <p className="text-sm text-(--text-muted) leading-relaxed">
                For complete privacy, screenshots automatically expire after 10 minutes from your
                local storage. Trigger a fresh capture anytime using keyboard shortcuts!
              </p>
            </div>
            <div className="flex gap-2 items-center justify-center mt-2">
              <kbd className="kbd-3d text-xs">Ctrl</kbd>
              <span className="text-xs text-(--text-muted)">+</span>
              <kbd className="kbd-3d text-xs">Shift</kbd>
              <span className="text-xs text-(--text-muted)">+</span>
              <kbd className="kbd-3d text-xs">S</kbd>
            </div>
          </div>
        )}

        {/* Error state */}
        {state.status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-(--text) mb-2">Capture Error</h2>
              <p className="text-sm text-(--text-muted) font-mono bg-(--surface-hover) p-3 rounded-lg border border-(--border)">
                {state.message}
              </p>
            </div>
          </div>
        )}

        {/* Loaded State: Studio Canvas & Info Bar */}
        {state.status === "loaded" && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Top Workspace Toolbar (Zoom, Fit, URL) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-(--surface) border border-(--border) rounded-xl px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden text-xs text-(--text-muted)">
                <FileImage className="w-3.5 h-3.5 shrink-0 text-(--accent)" />
                <span className="truncate max-w-xs sm:max-w-md font-mono" title={state.record.url}>
                  {state.record.url || "Local capture"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg border border-(--border) hover:bg-(--surface-hover) text-(--text) transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-(--surface-hover) border border-(--border) min-w-12.5 text-center">
                  {fitMode === "fit" ? "Fit" : `${zoomLevel}%`}
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg border border-(--border) hover:bg-(--surface-hover) text-(--text) transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`p-1.5 rounded-lg border border-(--border) hover:bg-(--surface-hover) text-(--text) transition-colors ${
                    fitMode === "fit" ? "bg-(--accent)/15 border-(--accent) text-(--accent)" : ""
                  }`}
                  title="Fit to Window"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* The Main High-Res Canvas */}
            <div className="flex-1 min-h-125 max-h-[72vh] overflow-auto rounded-2xl border border-(--border) bg-(--surface) relative p-4 flex items-center justify-center shadow-inner pattern-grid">
              <div
                className="transition-transform duration-150 origin-top flex items-center justify-center"
                style={{
                  width: fitMode === "fit" ? "100%" : "auto",
                  transform: fitMode === "custom" ? `scale(${zoomLevel / 100})` : "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.record.dataUrl}
                  alt="Captured screenshot high-fidelity"
                  className="rounded-lg shadow-2xl border border-(--border) block mx-auto max-w-full h-auto object-contain"
                  style={{
                    imageRendering: "auto",
                    maxHeight: fitMode === "fit" ? "68vh" : "none",
                  }}
                />
              </div>
            </div>

            {/* Bottom Inspector Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-(--surface) border border-(--border) rounded-xl px-4 py-3 shadow-sm text-xs text-(--text-muted)">
              <div className="flex flex-wrap items-center gap-3 font-mono">
                <span className="font-bold text-sm text-(--text)">
                  {state.record.width} × {state.record.height}
                  <span className="text-[10px] font-normal text-(--text-muted) ml-1">px</span>
                </span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-semibold">
                  PNG 100% Crisp
                </span>
                <span>·</span>
                <span>{formatFileSize(state.record.dataUrl)}</span>
                <span>·</span>
                <span className="truncate max-w-xs" title={state.record.filename}>
                  {state.record.filename}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved locally in Chrome Sandbox</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-(--border) py-4 px-6 text-center bg-(--surface)">
        <p className="text-xs text-(--text-muted)">
          FullPagePrint Studio · Zero server uploads · Pure client-side privacy ·{" "}
          <Link href="/privacy" className="text-(--text) hover:underline font-medium">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
