/**
 * Offscreen Document
 *
 * Handles operations that require a DOM context in MV3:
 * - Clipboard write (copy image)
 * - Canvas-based image stitching (full-page)
 * - Image cropping (selection)
 * - Image dimension measurement
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'STITCH_CHUNKS': {
          const dataUrl = await stitchChunks(
            message.chunks as string[],
            message.width as number,
            message.height as number,
            message.chunkHeight as number,
            message.lastChunkHeight as number,
            message.yOffsets as number[] | undefined
          );
          sendResponse({ dataUrl });
          break;
        }
        case 'CROP_IMAGE': {
          const dataUrl = await cropImage(message.dataUrl as string, message.rect as {
            x: number; y: number; width: number; height: number; devicePixelRatio: number;
          });
          sendResponse({ dataUrl });
          break;
        }
        case 'CONVERT_TO_JPEG': {
          const dataUrl = await convertToJpeg(message.dataUrl as string, (message.quality as number) || 0.92);
          sendResponse({ dataUrl });
          break;
        }
        case 'GET_IMAGE_DIMENSIONS': {
          const dims = await getImageDimensions(message.dataUrl as string);
          sendResponse(dims);
          break;
        }
        default:
          sendResponse({ ok: false, error: 'Unknown message' });
      }
    } catch (err) {
      console.warn('[Offscreen] Handled error:', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true;
});

async function convertToJpeg(dataUrl: string, quality = 0.92): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  // Fill white background for transparent pixels in JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const jpegUrl = canvas.toDataURL('image/jpeg', quality);
  canvas.width = 0;
  canvas.height = 0;
  return jpegUrl;
}

// ─── Image Stitching ──────────────────────────────────────────────────────────

async function stitchChunks(
  chunks: string[],
  width: number,
  totalHeight: number,
  chunkHeight: number,
  _lastChunkHeight: number,
  yOffsets?: number[]
): Promise<string> {
  // Prevent canvas dimension crash (safe browser limit is 16384px)
  const MAX_CANVAS_DIM = 16384;
  const safeHeight = Math.min(totalHeight, MAX_CANVAS_DIM);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = safeHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context creation failed');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < chunks.length; i++) {
    const img = await loadImage(chunks[i]);
    let yOffset: number;

    if (chunks.length === 1) {
      yOffset = 0;
    } else if (i === chunks.length - 1) {
      // Last chunk: align with the bottom of canvas so there is no gap or overshoot
      yOffset = Math.max(0, safeHeight - img.height);
    } else if (yOffsets && typeof yOffsets[i] === 'number') {
      // If yOffsets provided, convert scroll offset to physical coordinates
      const ratio = totalHeight > 0 ? safeHeight / totalHeight : 1;
      const dpr = img.width > 0 && width > 0 ? img.width / (width / (window.devicePixelRatio || 1)) : 1;
      yOffset = Math.round(yOffsets[i] * dpr * ratio);
    } else {
      yOffset = i * chunkHeight;
    }

    ctx.drawImage(img, 0, Math.max(0, Math.min(yOffset, safeHeight - 1)));
  }

  const dataUrl = canvas.toDataURL('image/png');

  // Release memory
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

// ─── Crop ─────────────────────────────────────────────────────────────────────

async function cropImage(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number; devicePixelRatio: number }
): Promise<string> {
  const img = await loadImage(dataUrl);

  const dpr = rect.devicePixelRatio || 1;
  const sx = rect.x * dpr;
  const sy = rect.y * dpr;
  const sw = rect.width * dpr;
  const sh = rect.height * dpr;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const result = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(dataUrl);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
