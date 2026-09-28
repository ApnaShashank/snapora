/**
 * Content Script: Area Selection
 *
 * Injects a full-screen overlay for the user to drag-select a region.
 * Sends the selection rect back to the service worker.
 */

import type { ExtensionMessage, SelectionRect } from '../shared/types';
import { OVERLAY_Z_INDEX } from '../shared/constants';

// Guard: don't inject twice
const win = window as Window & { __captureSelectionActive?: boolean };
if (win.__captureSelectionActive) {
  // Already active – do nothing
} else {
  win.__captureSelectionActive = true;
  initSelection();
}

let overlay: HTMLDivElement | null = null;
let selectionBox: HTMLDivElement | null = null;
let dimensionLabel: HTMLDivElement | null = null;
let instructionLabel: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;
let isDragging = false;

function initSelection(): void {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message.type === 'CAPTURE_SELECTION') {
      startSelection();
    }
  });
}

function startSelection(): void {
  cleanup();
  buildOverlay();
  document.addEventListener('keydown', onKeyDown, { capture: true });
}

function buildOverlay(): void {
  overlay = document.createElement('div');
  overlay.id = '__capture-overlay__';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:${OVERLAY_Z_INDEX};
    cursor:crosshair;background:rgba(0,0,0,0.35);
    user-select:none;-webkit-user-select:none;
  `;

  instructionLabel = document.createElement('div');
  instructionLabel.style.cssText = `
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:16px;font-weight:500;text-align:center;line-height:1.6;
    pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,0.5);
  `;
  instructionLabel.innerHTML = 'Drag to select an area<br><span style="font-size:13px;opacity:0.8">Press Esc to cancel</span>';
  overlay.appendChild(instructionLabel);

  selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position:absolute;border:2px solid #3b82f6;
    background:rgba(59,130,246,0.08);display:none;
  `;
  overlay.appendChild(selectionBox);

  dimensionLabel = document.createElement('div');
  dimensionLabel.style.cssText = `
    position:absolute;background:#1e40af;color:#fff;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:12px;font-weight:600;padding:3px 8px;border-radius:4px;
    pointer-events:none;display:none;white-space:nowrap;
  `;
  overlay.appendChild(dimensionLabel);

  overlay.addEventListener('mousedown', onMouseDown);
  overlay.addEventListener('mousemove', onMouseMove);
  overlay.addEventListener('mouseup', onMouseUp);

  document.body.appendChild(overlay);
}

function onMouseDown(e: MouseEvent): void {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;

  if (instructionLabel) instructionLabel.style.display = 'none';
  if (selectionBox) selectionBox.style.display = 'block';
  if (dimensionLabel) dimensionLabel.style.display = 'block';

  updateSelectionBox(e.clientX, e.clientY);
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging) return;
  updateSelectionBox(e.clientX, e.clientY);
}

function onMouseUp(e: MouseEvent): void {
  if (!isDragging) return;
  isDragging = false;

  const rect = getSelectionRect(startX, startY, e.clientX, e.clientY);

  if (rect.width < 4 || rect.height < 4) {
    cleanup();
    chrome.runtime.sendMessage({ type: 'SELECTION_CANCELLED' } as ExtensionMessage);
    return;
  }

  const selRect: SelectionRect = {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  cleanup();
  chrome.runtime.sendMessage({ type: 'SELECTION_READY', rect: selRect } as ExtensionMessage);
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopImmediatePropagation();
    cleanup();
    chrome.runtime.sendMessage({ type: 'SELECTION_CANCELLED' } as ExtensionMessage);
  }
}

function updateSelectionBox(currentX: number, currentY: number): void {
  if (!selectionBox || !dimensionLabel) return;
  const rect = getSelectionRect(startX, startY, currentX, currentY);

  selectionBox.style.left = `${rect.x}px`;
  selectionBox.style.top = `${rect.y}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;
  selectionBox.style.boxShadow = `0 0 0 1px #3b82f6, 0 0 0 9999px rgba(0,0,0,0.45)`;

  dimensionLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  const labelY = rect.y > 28 ? rect.y - 28 : rect.y + rect.height + 6;
  dimensionLabel.style.left = `${rect.x}px`;
  dimensionLabel.style.top = `${labelY}px`;
}

function getSelectionRect(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

function cleanup(): void {
  isDragging = false;
  document.removeEventListener('keydown', onKeyDown, { capture: true });
  overlay?.remove();
  overlay = null;
  selectionBox = null;
  dimensionLabel = null;
  instructionLabel = null;
  win.__captureSelectionActive = false;
}
