/**
 * Content Script: Full Page Capture
 *
 * Strategy:
 * 1. Measure total page dimensions reliably
 * 2. Force instantaneous scrolling (disable smooth scroll)
 * 3. Hide fixed/sticky elements temporarily during middle/subsequent chunks
 * 4. Scroll with adequate settle time (avoiding Chrome 2 calls/sec capture quota)
 * 5. Send chunks + metadata to background service worker for stitching
 * 6. Restore page scroll, visibility, and styles
 */

import type { ExtensionMessage } from '../shared/types';
import { SCROLL_SETTLE_MS, CHUNK_HEIGHT_PX } from '../shared/constants';

// Guard against multiple message listeners
const win = window as Window & {
  __fullpageListenerReady?: boolean;
  __fullpageCapturing?: boolean;
};

if (!win.__fullpageListenerReady) {
  win.__fullpageListenerReady = true;
  chrome.runtime.onMessage.addListener(onMessage);
}

function onMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  if (message.type === 'CAPTURE_FULLPAGE') {
    if (win.__fullpageCapturing) {
      sendResponse({ ok: false, error: 'Capture already in progress' });
      return false;
    }
    // Acknowledge immediately to prevent port closed / timeout errors
    sendResponse({ ok: true });

    captureFullPage().catch((err) => {
      chrome.runtime.sendMessage({
        type: 'FULLPAGE_CAPTURE_ERROR',
        error: String(err),
      } as ExtensionMessage);
    });
    return false;
  }
  return false;
}

async function captureFullPage(): Promise<void> {
  win.__fullpageCapturing = true;

  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;
  const originalOverflow = document.documentElement.style.overflow;

  // Temporarily disable smooth scrolling so scrollTo jumps immediately
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  const prevHtmlScrollBehavior = htmlEl.style.scrollBehavior;
  const prevBodyScrollBehavior = bodyEl.style.scrollBehavior;
  htmlEl.style.setProperty('scroll-behavior', 'auto', 'important');
  bodyEl.style.setProperty('scroll-behavior', 'auto', 'important');

  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  const fixedElements = getFixedStickyElements();

  window.scrollTo(0, 0);
  await sleep(SCROLL_SETTLE_MS);

  const chunks: string[] = [];
  const yOffsets: number[] = [];
  let scrollY = 0;
  const effectiveChunkHeight = Math.min(viewportHeight, CHUNK_HEIGHT_PX);
  let step = 0;
  const totalSteps = Math.ceil(totalHeight / effectiveChunkHeight);

  try {
    while (scrollY < totalHeight) {
      const isLastChunk = scrollY + viewportHeight >= totalHeight;

      if (scrollY > 0) {
        setElementsVisibility(fixedElements, 'hidden');
      }

      const dataUrl = await captureCurrentViewport();

      if (scrollY > 0) {
        setElementsVisibility(fixedElements, 'visible');
      }

      chunks.push(dataUrl);
      yOffsets.push(scrollY);
      step++;

      try {
        chrome.runtime.sendMessage({
          type: 'FULLPAGE_PROGRESS',
          step,
          total: totalSteps,
        } as ExtensionMessage);
      } catch { /* non-critical */ }

      if (isLastChunk) break;

      scrollY = Math.min(scrollY + effectiveChunkHeight, Math.max(0, totalHeight - viewportHeight));
      window.scrollTo(0, scrollY);
      await sleep(SCROLL_SETTLE_MS);
    }

    const pixelWidth = viewportWidth * dpr;
    const pixelHeight = totalHeight * dpr;
    const chunkHeightPx = effectiveChunkHeight * dpr;
    const lastChunkHeightPx = (totalHeight - (chunks.length - 1) * effectiveChunkHeight) * dpr;

    chrome.runtime.sendMessage({
      type: 'FULLPAGE_CAPTURE_DONE',
      chunks,
      width: pixelWidth,
      height: pixelHeight,
      chunkHeight: chunkHeightPx,
      lastChunkHeight: lastChunkHeightPx,
      yOffsets,
    } as ExtensionMessage);
  } finally {
    setElementsVisibility(fixedElements, 'visible');
    window.scrollTo(originalScrollX, originalScrollY);
    htmlEl.style.scrollBehavior = prevHtmlScrollBehavior;
    bodyEl.style.scrollBehavior = prevBodyScrollBehavior;
    document.documentElement.style.overflow = originalOverflow;
    win.__fullpageCapturing = false;
  }
}

function captureCurrentViewport(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { type: 'CAPTURE_VIEWPORT_CHUNK' as any },
      (response: { dataUrl?: string; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.dataUrl) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error ?? 'No data URL'));
        }
      }
    );
  });
}

function getFixedStickyElements(): HTMLElement[] {
  const result: HTMLElement[] = [];
  try {
    document.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        result.push(el as HTMLElement);
      }
    });
  } catch { /* non-critical */ }
  return result;
}

function setElementsVisibility(elements: HTMLElement[], visibility: 'visible' | 'hidden'): void {
  elements.forEach((el) => {
    try {
      el.style.visibility = visibility;
    } catch { /* ignore */ }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
