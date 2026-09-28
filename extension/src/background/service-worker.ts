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
let offscreenCreating: Promise<void> | null = null;

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
  if (isCapturing) {
    console.warn('[Capture] Already capturing, ignoring:', command);
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id || !tab.url) return;

  if (isRestrictedUrl(tab.url)) {
    await notifyTab(tab.id, 'Cannot capture this page – Chrome restricts screenshots here.', 'error');
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
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) await initiateVisible(tab);
          else if (tab?.id) await notifyTab(tab.id, 'Cannot capture this page.', 'error');
          sendResponse({ ok: true });
          break;
        }
        case 'CAPTURE_FULLPAGE': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) await initiateFullPage(tab);
          else if (tab?.id) await notifyTab(tab.id, 'Cannot capture this page.', 'error');
          sendResponse({ ok: true });
          break;
        }
        case 'CAPTURE_SELECTION': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url && !isRestrictedUrl(tab.url)) await initiateSelection(tab);
          else if (tab?.id) await notifyTab(tab.id, 'Cannot capture this page.', 'error');
          sendResponse({ ok: true });
          break;
        }

        // ── Selection complete ─────────────────────────────────────────────────
        case 'SELECTION_READY': {
          const tab = await getActiveTab();
          if (tab?.id && tab.url) {
            await visibleAndCrop(tab, message.rect);
          }
          sendResponse({ ok: true });
          break;
        }
        case 'SELECTION_CANCELLED': {
          isCapturing = false;
          sendResponse({ ok: true });
          break;
        }

        // ── Full page chunk capture request from content script ──────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        case 'CAPTURE_VIEWPORT_CHUNK' as any: {
          // Content script asks us to capture the current viewport
          const tabId = sender.tab?.id;
          if (!tabId) { sendResponse({ error: 'No tab' }); break; }
          try {
            const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab!.windowId, { format: 'png' });
            sendResponse({ dataUrl });
          } catch (err) {
            sendResponse({ error: String(err) });
          }
          break;
        }

        // ── Full page capture completed (content script sends all chunks) ─────
        case 'FULLPAGE_CAPTURE_DONE': {
          const tabId = sender.tab?.id;
          if (tabId) await finalizeFullPage(tabId, message);
          sendResponse({ ok: true });
          break;
        }
        case 'FULLPAGE_CAPTURE_ERROR': {
          isCapturing = false;
          if (sender.tab?.id) await notifyTab(sender.tab.id, `Full page capture failed: ${message.error}`, 'error');
          sendResponse({ ok: true });
          break;
        }

        // ── Web app bridge request ─────────────────────────────────────────────
        case 'GET_CAPTURE': {
          const key = captureStorageKey(message.id);
          const result = await chrome.storage.local.get(key);
          const record: CaptureRecord | null = result[key] ?? null;
          // Check TTL
          if (record && record.expiresAt < Date.now()) {
            await chrome.storage.local.remove(key);
            sendResponse({ record: null, expired: true });
          } else {
            sendResponse({ record });
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

// ─── Capture Initiators ───────────────────────────────────────────────────────

async function initiateVisible(tab: chrome.tabs.Tab): Promise<void> {
  if (isCapturing) return;
  isCapturing = true;
  const tabId = tab.id!;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    await pipeline(dataUrl, 'visible', tabId, tab.url ?? '');
  } catch (err) {
    await notifyTab(tabId, `Capture failed: ${String(err)}`, 'error');
  } finally {
    isCapturing = false;
  }
}

async function visibleAndCrop(tab: chrome.tabs.Tab, rect: SelectionRect): Promise<void> {
  // isCapturing is still true from initiateSelection
  const tabId = tab.id!;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    const cropped = await cropViaOffscreen(dataUrl, rect);
    await pipeline(cropped, 'selection', tabId, tab.url ?? '');
  } catch (err) {
    await notifyTab(tabId, `Selection capture failed: ${String(err)}`, 'error');
  } finally {
    isCapturing = false;
  }
}

async function initiateFullPage(tab: chrome.tabs.Tab): Promise<void> {
  if (isCapturing) return;
  isCapturing = true;
  const tabId = tab.id!;
  try {
    // Inject fullpage content script
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/fullpage.js'] });
    // Trigger it
    await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_FULLPAGE' } as ExtensionMessage);
    // Pipeline completes when FULLPAGE_CAPTURE_DONE arrives
  } catch (err) {
    isCapturing = false;
    await notifyTab(tabId, `Full page capture failed: ${String(err)}`, 'error');
  }
}

async function finalizeFullPage(
  tabId: number,
  message: Extract<ExtensionMessage, { type: 'FULLPAGE_CAPTURE_DONE' }>
): Promise<void> {
  try {
    const settings = await getSettings();
    const tab = await chrome.tabs.get(tabId);
    const pageUrl = tab.url ?? '';

    const dataUrl = await stitchViaOffscreen(
      message.chunks,
      message.width,
      message.height,
      message.chunkHeight,
      message.lastChunkHeight
    );

    await pipeline(dataUrl, 'fullpage', tabId, pageUrl, settings);
  } catch (err) {
    await notifyTab(tabId, `Full page stitch failed: ${String(err)}`, 'error');
  } finally {
    isCapturing = false;
  }
}

async function initiateSelection(tab: chrome.tabs.Tab): Promise<void> {
  if (isCapturing) return;
  isCapturing = true;
  const tabId = tab.id!;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/selection.js'] });
    await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_SELECTION' } as ExtensionMessage);
    // Pipeline continues when SELECTION_READY arrives
  } catch (err) {
    isCapturing = false;
    await notifyTab(tabId, `Selection failed to start: ${String(err)}`, 'error');
  }
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

  const { width, height } = await measureViaOffscreen(dataUrl);
  const id = generateCaptureId();
  const filename = buildFilename(mode, pageUrl, settings.includeHostname, settings.format);

  const record: CaptureRecord = {
    id, dataUrl, filename, width, height, mode,
    url: pageUrl, timestamp: Date.now(), expiresAt: Date.now() + CAPTURE_TTL_MS,
  };

  await chrome.storage.local.set({ [captureStorageKey(id)]: record });

  // 1. Clipboard
  if (settings.autoCopy) {
    const ok = await copyViaOffscreen(dataUrl);
    if (!ok) {
      await notifyTab(tabId,
        'Screenshot captured. Clipboard permission unavailable – file downloaded instead.',
        'info'
      );
    } else {
      await notifyTab(tabId, 'Screenshot copied to clipboard ✓', 'success');
    }
  } else {
    await notifyTab(tabId, 'Screenshot captured ✓', 'success');
  }

  // 2. Download
  if (settings.autoDownload) {
    try {
      await chrome.downloads.download({
        url: dataUrl, filename, saveAs: false, conflictAction: 'uniquify',
      });
    } catch (err) {
      console.error('[SW] Download failed:', err);
    }
  }

  // 3. Open web app
  if (settings.openWebApp) {
    const webAppUrl = `${settings.webAppUrl}/capture/${id}`;
    await chrome.tabs.create({ url: webAppUrl, active: true });
  }
}

// ─── Offscreen Document ───────────────────────────────────────────────────────

async function ensureOffscreen(): Promise<void> {
  try {
    // @ts-expect-error – hasDocument not in all type defs
    if (await chrome.offscreen.hasDocument()) return;
  } catch { /* not available in older chrome */ }

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }
  offscreenCreating = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_URL,
    reasons: [chrome.offscreen.Reason.CLIPBOARD, chrome.offscreen.Reason.WORKERS],
    justification: 'Clipboard write and canvas operations for screenshots',
  });
  try { await offscreenCreating; } finally { offscreenCreating = null; }
}

async function copyViaOffscreen(dataUrl: string): Promise<boolean> {
  try {
    await ensureOffscreen();
    const res = await chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', dataUrl }) as { ok: boolean };
    return res?.ok === true;
  } catch (err) {
    console.error('[SW] Copy error:', err);
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
  chunkHeight: number, lastChunkHeight: number
): Promise<string> {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({
    type: 'STITCH_CHUNKS', chunks, width, height, chunkHeight, lastChunkHeight,
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
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
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('data:') ||
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
