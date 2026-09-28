// Shared types for the Capture extension

export type CaptureMode = 'visible' | 'fullpage' | 'selection';

export type CaptureStatus = 'pending' | 'capturing' | 'processing' | 'done' | 'error';

export interface CaptureRecord {
  id: string;
  dataUrl: string;       // base64 PNG data URL
  filename: string;
  width: number;
  height: number;
  mode: CaptureMode;
  url: string;           // page URL at capture time
  timestamp: number;     // Unix ms
  expiresAt: number;     // Unix ms (TTL)
}

export interface CaptureProgress {
  step: number;
  total: number;
  label: string;
}

// Messages sent between extension contexts
export type ExtensionMessage =
  | { type: 'CAPTURE_VISIBLE' }
  | { type: 'CAPTURE_FULLPAGE' }
  | { type: 'CAPTURE_SELECTION' }
  | { type: 'SELECTION_READY'; rect: SelectionRect }
  | { type: 'SELECTION_CANCELLED' }
  | { type: 'FULLPAGE_CAPTURE_CHUNK'; dataUrl: string; index: number; totalChunks: number }
  | { type: 'FULLPAGE_CAPTURE_DONE'; chunks: string[]; width: number; height: number; chunkHeight: number; lastChunkHeight: number }
  | { type: 'FULLPAGE_CAPTURE_ERROR'; error: string }
  | { type: 'FULLPAGE_PROGRESS'; step: number; total: number }
  | { type: 'COPY_TO_CLIPBOARD'; dataUrl: string }
  | { type: 'COPY_SUCCESS' }
  | { type: 'COPY_ERROR'; error: string }
  | { type: 'GET_CAPTURE'; id: string }
  | { type: 'CAPTURE_DATA'; record: CaptureRecord | null }
  | { type: 'SHOW_NOTIFICATION'; message: string; variant: 'success' | 'error' | 'info' };

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface Settings {
  autoCopy: boolean;
  autoDownload: boolean;
  openWebApp: boolean;
  format: 'png' | 'jpg';
  quality: number;       // 0-100 for jpg
  includeHostname: boolean;
  webAppUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  autoCopy: true,
  autoDownload: true,
  openWebApp: true,
  format: 'png',
  quality: 92,
  includeHostname: false,
  webAppUrl: 'https://fullpageprint.vercel.app',
};
