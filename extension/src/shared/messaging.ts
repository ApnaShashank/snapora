// Messaging helpers for the Capture extension

import type { ExtensionMessage } from './types';

/**
 * Send a message to the service worker background script.
 */
export function sendToBackground(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Send a message to a specific tab's content scripts.
 */
export function sendToTab(tabId: number, message: ExtensionMessage): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message);
}

/**
 * Generate a cryptographically random capture ID.
 */
export function generateCaptureId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build the storage key for a given capture ID.
 */
export function captureStorageKey(id: string): string {
  return `capture:${id}`;
}

/**
 * Generate a screenshot filename with timestamp and optional hostname.
 */
export function buildFilename(
  mode: string,
  pageUrl: string,
  includeHostname: boolean,
  ext: 'png' | 'jpg' = 'png'
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('-');

  if (includeHostname) {
    try {
      const hostname = new URL(pageUrl).hostname
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40);
      return `${hostname}-${timestamp}.${ext}`;
    } catch {
      // fall through
    }
  }

  return `screenshot-${timestamp}.${ext}`;
}
