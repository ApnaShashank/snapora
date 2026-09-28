"use client";

/**
 * /capture/[id] page
 *
 * This page receives a screenshot from the Chrome extension via:
 * 1. The extension injects content/bridge.js into this page
 * 2. bridge.js reads the capture record from chrome.storage.local
 * 3. bridge.js posts { source: 'capture-extension', type: 'CAPTURE_BRIDGE_DATA', record } to window
 * 4. This page listens for that message and renders the screenshot
 *
 * Fallback: If no extension is installed or the record has expired,
 * shows an appropriate message.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Camera,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Monitor,
  Layers,
  Crop,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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

const MODE_ICONS = {
  visible: <Monitor className="w-3.5 h-3.5" />,
  fullpage: <Layers className="w-3.5 h-3.5" />,
  selection: <Crop className="w-3.5 h-3.5" />,
};

const MODE_LABELS = {
  visible: "Visible",
  fullpage: "Full Page",
  selection: "Selected Area",
};

function formatFileSize(dataUrl: string): string {
  // base64 data length → approximate bytes
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Math.round((base64.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default function CapturePage() {
  const params = useParams();
  const captureId = params?.id as string;

  const [state, setState] = useState<PageState>(
    captureId ? { status: "loading" } : { status: "waiting" }
  );
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "done">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!captureId) return;

    // Listen for bridge message from the extension content script
    const handleMessage = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "capture-extension" ||
        event.data?.type !== "CAPTURE_BRIDGE_DATA"
      )
        return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const { record, error } = event.data;

      if (error && !record) {
        setState({ status: "error", message: error });
        return;
      }

      if (!record) {
        setState({ status: "expired" });
        return;
      }

      setState({ status: "loaded", record });
    };

    window.addEventListener("message", handleMessage);

    // If no message in 5s → extension not installed
    timeoutRef.current = setTimeout(() => {
      setState((s) => {
        if (s.status === "loading") return { status: "no-extension" };
        return s;
      });
    }, 5000);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [captureId]);

  const handleCopy = useCallback(async () => {
    if (state.status !== "loaded") return;
    setCopyState("copying");
    try {
      const blob = dataUrlToBlob(state.record.dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-[#FAFAF9]">
      {/* Header */}
      <header className="border-b border-[#27272A] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
          {state.status === "loaded" && (
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <span>Captured at {formatTimestamp(state.record.timestamp)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Loading */}
        {(state.status === "waiting" || state.status === "loading") && (
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <Loader2 className="w-8 h-8 text-[#4F6EF7] animate-spin" />
            <p className="text-[#A1A1AA] text-sm">Loading screenshot…</p>
          </div>
        )}

        {/* No extension */}
        {state.status === "no-extension" && (
          <div className="flex flex-col items-center justify-center h-72 gap-4 text-center">
            <div className="w-14 h-14 bg-[#18181B] border border-[#27272A] rounded-2xl flex items-center justify-center">
              <Camera className="w-7 h-7 text-[#71717A]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Extension not detected</h2>
              <p className="text-[#A1A1AA] text-sm max-w-md">
                The Snapora Chrome extension needs to be installed and enabled to view screenshots
                here. If you already have it installed, try capturing a new screenshot.
              </p>
            </div>
            <Link
              href="/#shortcuts"
              className="bg-[#4F6EF7] hover:bg-[#3E5DE5] text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              Get Snapora Extension
            </Link>
          </div>
        )}

        {/* Expired */}
        {state.status === "expired" && (
          <div className="flex flex-col items-center justify-center h-72 gap-4 text-center">
            <div className="w-14 h-14 bg-[#18181B] border border-[#27272A] rounded-2xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-[#71717A]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Screenshot expired</h2>
              <p className="text-[#A1A1AA] text-sm max-w-md">
                This screenshot link has expired (screenshots are kept locally for 10 minutes for privacy).
                Take a new screenshot to view it here.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center h-72 gap-4 text-center">
            <div className="w-14 h-14 bg-[#18181B] border border-[#27272A] rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
              <p className="text-[#A1A1AA] text-sm max-w-md font-mono">{state.message}</p>
            </div>
          </div>
        )}

        {/* Loaded */}
        {state.status === "loaded" && (
          <div className="flex flex-col gap-6">
            {/* Image preview */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]" />
                  </div>
                  <span className="text-xs text-[#A1A1AA] ml-2 truncate max-w-xs">
                    {state.record.url || "Screenshot"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] bg-[#222226] px-2.5 py-1 rounded-md border border-[#27272A]">
                  {MODE_ICONS[state.record.mode]}
                  <span>{MODE_LABELS[state.record.mode]}</span>
                </div>
              </div>

              {/* Image */}
              <div className="relative overflow-auto max-h-[65vh] bg-[#141416]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='%2318181B'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%2318181B'/%3E%3Crect x='10' width='10' height='10' fill='%23141416'/%3E%3Crect y='10' width='10' height='10' fill='%23141416'/%3E%3C/svg%3E")`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.record.dataUrl}
                  alt="Screenshot preview"
                  className="max-w-full mx-auto block"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            </div>

            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] rounded-xl px-5 py-4">
              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                <span className="font-medium text-white text-base">
                  {state.record.width} × {state.record.height}
                </span>
                <span>·</span>
                <span>PNG</span>
                <span>·</span>
                <span>{formatFileSize(state.record.dataUrl)}</span>
                <span>·</span>
                <span className="text-xs font-mono truncate max-w-[200px]">
                  {state.record.filename}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  id="btn-copy-image"
                  onClick={handleCopy}
                  disabled={copyState === "copying"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    copyState === "done"
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : copyState === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : "bg-[#222226] hover:bg-[#2A2A2E] text-white border border-[#27272A] hover:border-[#3F3F46]"
                  }`}
                >
                  {copyState === "done" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : copyState === "error" ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : copyState === "copying" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copyState === "done"
                    ? "Copied to clipboard"
                    : copyState === "error"
                    ? "Failed"
                    : "Copy Image"}
                </button>

                <button
                  id="btn-download-image"
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    downloadState === "done"
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : "bg-[#4F6EF7] hover:bg-[#3E5DE5] text-white"
                  }`}
                >
                  {downloadState === "done" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadState === "done" ? "Downloaded!" : "Download"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A] py-5 px-6 text-center">
        <p className="text-xs text-[#71717A]">
          Snapora stores screenshots temporarily in your local browser sandbox.{" "}
          <Link href="/privacy" className="text-[#A1A1AA] hover:text-white underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
