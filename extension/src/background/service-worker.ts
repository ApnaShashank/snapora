/**
 * Capture Extension – Service Worker (Background)
 *
 * Responsibilities:
 * - Listen for keyboard shortcut commands
 * - Listen for popup messages
 * - Orchestrate the capture pipeline:
 *     Capture → Copy to clipboard → Download → Open web app
 * - Store capture records in chrome.storage.local (TTL-based)
 * - Manage the offscreen document for clipboard operations
 *
 * Permissions used:
 * - activeTab: capture current tab screenshot
 * - scripting: inject content scripts for selection and full-page
 * - tabs: create new tab for web app, query active tab
 * - storage: persist capture records with TTL
 * - downloads: save screenshot files
 * - offscreen: clipboard write (MV3 requirement) + canvas stitching
 */

import type { CaptureMode, CaptureRecord, ExtensionMessage, Settings, SelectionRect } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { CAPTURE_TTL_MS, OFFSCREEN_DOCUMENT_URL } from '../shared/constants';
import { generateCaptureId, captureStorageKey, buildFilename } from '../shared/messaging';

// ─── State ──────────────────────────────────────────────────────────────────

let isCapturing = false;
let captureTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let offscreenCreating: Promise<void> | null = null;
const recentCaptures = new Map<string, CaptureRecord>();

function startCaptureLock(): boolean {
  if (isCapturing) {
    console.warn('[Capture] Already capturing, ignoring duplicate request');
    return false;
  }
  isCapturing = true;
  if (captureTimeoutTimer) clearTimeout(captureTimeoutTimer);
  // Auto-release after 45 seconds max so user is never locked out
  captureTimeoutTimer = setTimeout(() => {
    if (isCapturing) {
      console.warn('[Capture] Capture lock timed out, auto-releasing');
      isCapturing = false;
    }
  }, 45000);
  return true;
}

function releaseCaptureLock(): void {
  isCapturing = false;
  if (captureTimeoutTimer) {
    clearTimeout(captureTimeoutTimer);
    captureTimeoutTimer = null;
  }
}

// ─── Install ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result['settings']) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
  cleanupExpiredCaptures();
});

setInterval(cleanupExpiredCaptures, 5 * 60 * 1000);

// ─── Command Listener ────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  const tab = await getActiveTab();
  if (!tab?.id || !tab.url) return;

  if (isRestrictedUrl(tab.url)) {
    const settings = await getSettings();
    const cleanUrl = (settings.webAppUrl || DEFAULT_SETTINGS.webAppUrl).replace(/\/+$/, '');
    chrome.tabs.create({ url: cleanUrl, active: true }).catch(() => {});
    await notifyTab(tab.id, 'Opening FullPagePrint Studio for internal Chrome page ✓', 'info');
    return;
  }

  switch (command) {
    case 'capture-visible':
      await initiateVisible(tab);
      break;
    case 'capture-fullpage':
      await initiateFullPage(tab);
      break;
    case 'capture-selection':
      await initiateSelection(tab);
      break;
  }
});

// ─── Message Listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {

        // ── Popup-initiated captures ──────────────────────────────────────────
        case 'CAPTURE_VISIBLE': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) {
            await initiateVisible(tab);
          } else if (tab?.id) {
            const settings = await getSettings();
            const cleanUrl = (settings.webAppUrl || DEFAULT_SETTINGS.webAppUrl).replace(/\/+$/, '');
            chrome.tabs.create({ url: cleanUrl, active: true }).catch(() => {});
            await notifyTab(tab.id, 'Opening FullPagePrint Studio for internal Chrome page ✓', 'info');
          }
          sendResponse({ ok: true });
          break;
        }
        case 'CAPTURE_FULLPAGE': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) {
            await initiateFullPage(tab);
          } else if (tab?.id) {
            const settings = await getSettings();
            const cleanUrl = (settings.webAppUrl || DEFAULT_SETTINGS.webAppUrl).replace(/\/+$/, '');
            chrome.tabs.create({ url: cleanUrl, active: true }).catch(() => {});
            await notifyTab(tab.id, 'Opening FullPagePrint Studio for internal Chrome page ✓', 'info');
          }
          sendResponse({ ok: true });
          break;
        }
        case 'CAPTURE_SELECTION': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) {
            await initiateSelection(tab);
          } else if (tab?.id) {
            const settings = await getSettings();
            const cleanUrl = (settings.webAppUrl || DEFAULT_SETTINGS.webAppUrl).replace(/\/+$/, '');
            chrome.tabs.create({ url: cleanUrl, active: true }).catch(() => {});
            await notifyTab(tab.id, 'Opening FullPagePrint Studio for internal Chrome page ✓', 'info');
          }
          sendResponse({ ok: true });
          break;
        }

        // ── Selection complete ─────────────────────────────────────────────────
        case 'SELECTION_READY': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url) {
            await visibleAndCrop(tab, message.rect);
          } else {
            releaseCaptureLock();
          }
          sendResponse({ ok: true });
          break;
        }
        case 'SELECTION_CANCELLED': {
          releaseCaptureLock();
          sendResponse({ ok: true });
          break;
        }

        // ── Full page chunk capture request from content script ──────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        case 'CAPTURE_VIEWPORT_CHUNK' as any: {
          const windowId = sender.tab?.windowId;
          if (windowId === undefined) {
            sendResponse({ error: 'No active tab window' });
            break;
          }
          try {
            const dataUrl = await captureVisibleTabWithRetry(windowId, { format: 'png' });
            sendResponse({ dataUrl });
          } catch (err) {
            sendResponse({ error: String(err) });
          }
          break;
        }

        // ── Full page capture completed (content script sends all chunks) ─────
        case 'FULLPAGE_CAPTURE_DONE': {
          const tabId = sender.tab?.id;
          if (tabId) {
            await finalizeFullPage(tabId, message as Extract<ExtensionMessage, { type: 'FULLPAGE_CAPTURE_DONE' }> & { yOffsets?: number[] });
          } else {
            releaseCaptureLock();
          }
          sendResponse({ ok: true });
          break;
        }
        case 'FULLPAGE_CAPTURE_ERROR': {
          releaseCaptureLock();
          const tabId = sender.tab?.id;
          if (tabId) {
            try {
              const tab = await chrome.tabs.get(tabId);
              console.warn('[SW] FULLPAGE_CAPTURE_ERROR received, falling back to visible screen capture');
              await initiateVisible(tab);
              await notifyTab(tabId, 'Full page unavailable here. Captured visible view instead ✓', 'info');
            } catch { /* tab closed */ }
          }
          sendResponse({ ok: true });
          break;
        }

        // ── Web app bridge request ─────────────────────────────────────────────
        case 'GET_CAPTURE': {
          const id = message.id;

          // 1. Check in-memory map first (instant zero-latency retrieval)
          if (recentCaptures.has(id)) {
            const memoryRecord = recentCaptures.get(id)!;
            if (memoryRecord.expiresAt >= Date.now()) {
              sendResponse({ record: memoryRecord, expired: false });
              break;
            }
          }

          // 2. Check chrome.storage.local
          const key = captureStorageKey(id);
          const result = await chrome.storage.local.get(key);
          const record: CaptureRecord | null = result[key] ?? null;

          if (record && record.expiresAt < Date.now()) {
            await chrome.storage.local.remove(key);
            sendResponse({ record: null, expired: true });
          } else if (record) {
            recentCaptures.set(id, record); // Populate memory cache
            sendResponse({ record, expired: false });
          } else {
            sendResponse({ record: null, expired: false });
          }
          break;
        }

        default:
          sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (err) {
      console.error('[SW] Message error:', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // async sendResponse
});

// ─── Capture Visible Tab with Quota Retry ────────────────────────────────────

async function captureVisibleTabWithRetry(
  windowId: number,
  options: chrome.tabs.CaptureVisibleTabOptions = { format: 'png' },
  maxRetries = 4,
  initialDelayMs = 500
): Promise<string> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await chrome.tabs.captureVisibleTab(windowId, options);
    } catch (err: unknown) {
      attempt++;
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota = msg.toLowerCase().includes('max_capture_visible_tab') ||
                      msg.toLowerCase().includes('calls per second') ||
                      msg.toLowerCase().includes('rate');
      if (isQuota && attempt <= maxRetries) {
        console.warn(`[SW] captureVisibleTab quota limit hit, retrying in ${initialDelayMs * attempt}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, initialDelayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Capture failed after quota retries');
}

// ─── Capture Initiators ───────────────────────────────────────────────────────

async function initiateVisible(tab: chrome.tabs.Tab): Promise<void> {
  if (!startCaptureLock()) return;
  const tabId = tab.id!;
  try {
    const dataUrl = await captureVisibleTabWithRetry(tab.windowId, { format: 'png' });
    await pipeline(dataUrl, 'visible', tabId, tab.url ?? '');
  } catch (err) {
    console.warn('[SW] Primary visible capture failed, trying current window:', err);
    try {
      const dataUrl = await captureVisibleTabWithRetry(chrome.windows.WINDOW_ID_CURRENT, { format: 'png' });
      await pipeline(dataUrl, 'visible', tabId, tab.url ?? '');
    } catch (fallbackErr) {
      console.error('[SW] All visible capture attempts failed:', fallbackErr);
      await notifyTab(tabId, 'Screen capture unavailable on this page.', 'error');
    }
  } finally {
    releaseCaptureLock();
  }
}

async function visibleAndCrop(tab: chrome.tabs.Tab, rect: SelectionRect): Promise<void> {
  const tabId = tab.id!;
  try {
    const dataUrl = await captureVisibleTabWithRetry(tab.windowId, { format: 'png' });
    const cropped = await cropViaOffscreen(dataUrl, rect);
    await pipeline(cropped, 'selection', tabId, tab.url ?? '');
  } catch (err) {
    console.warn('[SW] visibleAndCrop failed, executing visible screen fallback:', err);
    await initiateVisible(tab);
    await notifyTab(tabId, 'Crop unavailable. Captured visible view instead ✓', 'info');
  } finally {
    releaseCaptureLock();
  }
}

async function initiateFullPage(tab: chrome.tabs.Tab): Promise<void> {
  if (!startCaptureLock()) return;
  const tabId = tab.id!;
  try {
    // Inject fullpage content script
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/fullpage.js'] });
    // Settle delay
    await new Promise((r) => setTimeout(r, 60));
    // Trigger it
    await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_FULLPAGE' } as ExtensionMessage);
    // Pipeline completes when FULLPAGE_CAPTURE_DONE or FULLPAGE_CAPTURE_ERROR arrives
  } catch (err) {
    releaseCaptureLock();
    console.warn('[SW] initiateFullPage failed, falling back to visible screen capture:', err);
    await initiateVisible(tab);
    await notifyTab(tabId, 'Full page unavailable here. Captured visible view instead ✓', 'info');
  }
}

async function finalizeFullPage(
  tabId: number,
  message: Extract<ExtensionMessage, { type: 'FULLPAGE_CAPTURE_DONE' }> & { yOffsets?: number[] }
): Promise<void> {
  try {
    const settings = await getSettings();
    let pageUrl = '';
    try {
      const tab = await chrome.tabs.get(tabId);
      pageUrl = tab.url ?? '';
    } catch { /* tab closed or not found */ }

    const dataUrl = await stitchViaOffscreen(
      message.chunks,
      message.width,
      message.height,
      message.chunkHeight,
      message.lastChunkHeight,
      message.yOffsets
    );

    await pipeline(dataUrl, 'fullpage', tabId, pageUrl, settings);
  } catch (err) {
    console.warn('[SW] Full page stitch failed, falling back to visible screen capture:', err);
    try {
      const tab = await chrome.tabs.get(tabId);
      await initiateVisible(tab);
      await notifyTab(tabId, 'Full page stitch failed. Captured visible view instead ✓', 'info');
    } catch { /* tab closed */ }
  } finally {
    releaseCaptureLock();
  }
}

async function initiateSelection(tab: chrome.tabs.Tab): Promise<void> {
  if (!startCaptureLock()) return;
  const tabId = tab.id!;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/selection.js'] });
    await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_SELECTION' } as ExtensionMessage);
  } catch (err) {
    releaseCaptureLock();
    console.warn('[SW] initiateSelection failed, falling back to visible screen capture:', err);
    await initiateVisible(tab);
    await notifyTab(tabId, 'Selection overlay unavailable. Captured visible view instead ✓', 'info');
  }
}

// ─── Multi-Tier Clipboard Copy Fallback ──────────────────────────────────────

async function copyToClipboardWithFallback(tabId: number, dataUrl: string): Promise<boolean> {
  // Tier 1: Active tab script copy
  const tabOk = await copyViaActiveTab(tabId, dataUrl);
  if (tabOk) return true;

  // Tier 2: Offscreen document copy
  try {
    await ensureOffscreen();
    const res = await chrome.runtime.sendMessage({
      type: 'COPY_TO_CLIPBOARD',
      dataUrl,
    }) as { success?: boolean };
    if (res?.success) return true;
  } catch (err) {
    console.warn('[SW] Offscreen clipboard copy failed:', err);
  }

  return false;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function pipeline(
  dataUrl: string,
  mode: CaptureMode,
  tabId: number,
  pageUrl: string,
  settings?: Settings
): Promise<void> {
  if (!settings) settings = await getSettings();

  // Convert to JPEG if user chose JPG format in settings
  let finalDataUrl = dataUrl;
  if (settings.format === 'jpg' && !finalDataUrl.startsWith('data:image/jpeg')) {
    try {
      finalDataUrl = await convertToJpegViaOffscreen(dataUrl, (settings.quality || 92) / 100);
    } catch (err) {
      console.warn('[SW] JPEG conversion failed, using PNG fallback:', err);
    }
  }

  const { width, height } = await measureViaOffscreen(finalDataUrl);
  const id = generateCaptureId();
  const filename = buildFilename(mode, pageUrl, settings.includeHostname, settings.format);

  const record: CaptureRecord = {
    id, dataUrl: finalDataUrl, filename, width, height, mode,
    url: pageUrl, timestamp: Date.now(), expiresAt: Date.now() + CAPTURE_TTL_MS,
  };

  // 1. Ultra-fast in-memory cache for zero-latency retrieval by web app
  recentCaptures.set(id, record);
  if (recentCaptures.size > 25) {
    const oldestKey = recentCaptures.keys().next().value;
    if (oldestKey) recentCaptures.delete(oldestKey);
  }

  // 2. Fire Auto-Copy with Multi-Tier Fallbacks
  if (settings.autoCopy) {
    const copied = await copyToClipboardWithFallback(tabId, finalDataUrl);
    if (copied) {
      notifyTab(tabId, 'Screenshot copied to clipboard ✓', 'success').catch(() => {});
    } else {
      // Fallback: Trigger download if clipboard is blocked so file is preserved!
      chrome.downloads.download({
        url: finalDataUrl, filename, saveAs: false, conflictAction: 'uniquify',
      }).catch(() => {});
      notifyTab(tabId, 'Screenshot saved to downloads ✓', 'info').catch(() => {});
    }
  } else {
    notifyTab(tabId, 'Screenshot captured ✓', 'success').catch(() => {});
  }

  // 3. Parallelize storage and download operations for speed
  const asyncTasks: Promise<unknown>[] = [
    chrome.storage.local.set({ [captureStorageKey(id)]: record }).catch((err) => {
      console.warn('[SW] Storage set warning:', err);
    })
  ];

  if (settings.autoDownload && !settings.autoCopy) {
    asyncTasks.push(
      chrome.downloads.download({
        url: finalDataUrl, filename, saveAs: false, conflictAction: 'uniquify',
      }).catch((err) => {
        console.warn('[SW] Download warning:', err);
      })
    );
  }

  // 4. Open web app tab
  if (settings.openWebApp) {
    const cleanUrl = (settings.webAppUrl || DEFAULT_SETTINGS.webAppUrl).replace(/\/+$/, '');
    const webAppUrl = `${cleanUrl}/capture/${id}`;
    chrome.tabs.create({ url: webAppUrl, active: true }).catch(() => {});
  }

  await Promise.all(asyncTasks);
}

async function convertToJpegViaOffscreen(dataUrl: string, quality = 0.95): Promise<string> {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({
    type: 'CONVERT_TO_JPEG',
    dataUrl,
    quality,
  }) as { dataUrl?: string; error?: string };
  if (!res?.dataUrl) throw new Error(res?.error ?? 'JPEG conversion failed');
  return res.dataUrl;
}

// ─── Offscreen Document ───────────────────────────────────────────────────────

async function ensureOffscreen(): Promise<void> {
  try {
    if (chrome.offscreen?.hasDocument && await chrome.offscreen.hasDocument()) return;
  } catch { /* not available in older chrome */ }

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = (async () => {
    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_URL,
        reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
        justification: 'Canvas stitching and cropping operations for screenshots',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('Only a single offscreen document may be created')) {
        throw err;
      }
    }
  })();

  try {
    await offscreenCreating;
  } finally {
    offscreenCreating = null;
  }
}

async function copyViaActiveTab(tabId: number, dataUrl: string): Promise<boolean> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (base64Url: string) => {
        try {
          // Direct fast binary conversion (sub-millisecond)
          const commaIdx = base64Url.indexOf(',');
          const base64Data = commaIdx >= 0 ? base64Url.slice(commaIdx + 1) : base64Url;
          const mimeMatch = base64Url.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';

          const binStr = atob(base64Data);
          const len = binStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binStr.charCodeAt(i);
          }
          let pngBlob = new Blob([bytes], { type: mime });

          // If not PNG, convert via fast offscreen canvas
          if (mime !== 'image/png') {
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Image decode error'));
              img.src = base64Url;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0);
              pngBlob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b || pngBlob), 'image/png');
              });
            }
          }

          const item = new ClipboardItem({ 'image/png': pngBlob });
          await navigator.clipboard.write([item]);
          return true;
        } catch {
          return false;
        }
      },
      args: [dataUrl],
    });
    return results?.[0]?.result === true;
  } catch {
    return false;
  }
}

async function cropViaOffscreen(dataUrl: string, rect: SelectionRect): Promise<string> {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({ type: 'CROP_IMAGE', dataUrl, rect }) as { dataUrl?: string };
  if (!res?.dataUrl) throw new Error('Crop failed in offscreen');
  return res.dataUrl;
}

async function stitchViaOffscreen(
  chunks: string[], width: number, height: number,
  chunkHeight: number, lastChunkHeight: number,
  yOffsets?: number[]
): Promise<string> {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({
    type: 'STITCH_CHUNKS', chunks, width, height, chunkHeight, lastChunkHeight, yOffsets,
  }) as { dataUrl?: string; error?: string };
  if (!res?.dataUrl) throw new Error(res?.error ?? 'Stitch failed');
  return res.dataUrl;
}

async function measureViaOffscreen(dataUrl: string): Promise<{ width: number; height: number }> {
  try {
    await ensureOffscreen();
    const res = await chrome.runtime.sendMessage({ type: 'GET_IMAGE_DIMENSIONS', dataUrl }) as { width?: number; height?: number };
    return { width: res?.width ?? 0, height: res?.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tabLastFocused] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabLastFocused) return tabLastFocused;
  const [tabCurrent] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabCurrent;
}

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result['settings'] ?? {}) };
}

function isRestrictedUrl(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('data:') ||
    url.startsWith('view-source:') ||
    url === ''
  );
}

async function notifyTab(
  tabId: number,
  message: string,
  variant: 'success' | 'error' | 'info'
): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: injectToast,
      args: [message, variant],
    });
  } catch {
    // Tab restricted or closed – silent
  }
}

function injectToast(message: string, variant: 'success' | 'error' | 'info'): void {
  const existing = document.getElementById('__capture-toast__');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = '__capture-toast__';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  const bg = variant === 'success' ? '#16a34a' : variant === 'error' ? '#dc2626' : '#1d4ed8';
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:2147483647;
    background:${bg};color:#fff;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:13px;font-weight:500;line-height:1.5;
    padding:10px 16px;border-radius:10px;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
    max-width:340px;pointer-events:none;
    opacity:0;transform:translateY(8px);
    transition:opacity 0.2s,transform 0.2s;
  `;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 250);
  }, 4000);
}

async function cleanupExpiredCaptures(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const toRemove: string[] = [];
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith('capture:') && (val as CaptureRecord)?.expiresAt < now) {
      toRemove.push(key);
    }
  }
  if (toRemove.length) await chrome.storage.local.remove(toRemove);
}
