/**
 * Content Script: Full Page Capture
 *
 * Strategy:
 * 1. Measure total page dimensions
 * 2. Hide fixed/sticky elements temporarily to avoid duplication
 * 3. Scroll in chunks, capture each visible viewport
 * 4. Send chunks + metadata back to service worker for stitching
 * 5. Restore everything
 *
 * Known limitations (browser-imposed):
 * - Lazy-loaded images below the fold may not be rendered
 * - Complex CSS sticky stacking may appear in multiple chunks
 * - Very large pages (>15000px) may hit canvas memory limits
 */

import type { ExtensionMessage } from '../shared/types';
import { SCROLL_SETTLE_MS, CHUNK_HEIGHT_PX } from '../shared/constants';

// Guard against multiple injections
const win = window as Window & { __captureFullpageActive?: boolean };

if (!win.__captureFullpageActive) {
  win.__captureFullpageActive = true;
  chrome.runtime.onMessage.addListener(onMessage);
}

function onMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  if (message.type === 'CAPTURE_FULLPAGE') {
    captureFullPage()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        sendResponse({ ok: false });
        chrome.runtime.sendMessage({
          type: 'FULLPAGE_CAPTURE_ERROR',
          error: String(err),
        } as ExtensionMessage);
      });
    return true;
  }
  return false;
}

async function captureFullPage(): Promise<void> {
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;
  const originalOverflow = document.documentElement.style.overflow;

  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  const fixedElements = getFixedStickyElements();

  window.scrollTo(0, 0);
  await sleep(SCROLL_SETTLE_MS);

  const chunks: string[] = [];
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
      step++;

      try {
        chrome.runtime.sendMessage({
          type: 'FULLPAGE_PROGRESS',
          step,
          total: totalSteps,
        } as ExtensionMessage);
      } catch { /* non-critical */ }

      if (isLastChunk) break;

      scrollY = Math.min(scrollY + effectiveChunkHeight, totalHeight - viewportHeight);
      window.scrollTo(0, scrollY);
      await sleep(SCROLL_SETTLE_MS);
    }

    const pixelWidth = viewportWidth * dpr;
    const pixelHeight = totalHeight * dpr;
    const chunkHeightPx = effectiveChunkHeight * dpr;
    const lastChunkHeightPx = ((totalHeight - (chunks.length - 1) * effectiveChunkHeight)) * dpr;

    chrome.runtime.sendMessage({
      type: 'FULLPAGE_CAPTURE_DONE',
      chunks,
      width: pixelWidth,
      height: pixelHeight,
      chunkHeight: chunkHeightPx,
      lastChunkHeight: lastChunkHeightPx,
    } as ExtensionMessage);
  } finally {
    setElementsVisibility(fixedElements, 'visible');
    window.scrollTo(originalScrollX, originalScrollY);
    document.documentElement.style.overflow = originalOverflow;
    win.__captureFullpageActive = false;
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
  document.querySelectorAll('*').forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'sticky') {
      result.push(el as HTMLElement);
    }
  });
  return result;
}

function setElementsVisibility(elements: HTMLElement[], visibility: 'visible' | 'hidden'): void {
  elements.forEach((el) => { el.style.visibility = visibility; });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
