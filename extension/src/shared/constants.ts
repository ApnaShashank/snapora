// Shared constants for the Capture extension

export const CAPTURE_ID_PREFIX = 'capture:';
export const CAPTURE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export const OFFSCREEN_DOCUMENT_URL = 'offscreen/offscreen.html';

// Web app URLs (override via settings)
// Note: If port 3000 is in use, Next.js will automatically use 3001, 3002, etc.
// Update this in extension settings popup if needed.
export const WEB_APP_URL_DEV = 'http://localhost:3000';
export const WEB_APP_URL_PROD = 'https://fullpageprint.vercel.app';

// Scroll stabilisation delay (ms) during full-page capture
export const SCROLL_SETTLE_MS = 450;

// Max chunk height during full-page capture (pixels)
export const CHUNK_HEIGHT_PX = 1200;

// Notification display duration (ms)
export const NOTIFICATION_DURATION_MS = 3000;

// Selection overlay z-index
export const OVERLAY_Z_INDEX = 2147483647;
