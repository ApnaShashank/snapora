/**
 * Popup Script
 * Handles button clicks, settings load/save, and status messages.
 */

import './popup.css';
import type { ExtensionMessage, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

// ─── DOM refs ──────────────────────────────────────────────────────────────

const btnVisible = document.getElementById('btn-visible') as HTMLButtonElement;
const btnFullpage = document.getElementById('btn-fullpage') as HTMLButtonElement;
const btnSelection = document.getElementById('btn-selection') as HTMLButtonElement;
const btnSettingsToggle = document.getElementById('btn-settings-toggle') as HTMLButtonElement;
const sectionSettings = document.getElementById('section-settings') as HTMLElement;
const btnSaveSettings = document.getElementById('btn-save-settings') as HTMLButtonElement;
const linkShortcuts = document.getElementById('link-shortcuts') as HTMLAnchorElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const statusMessage = document.getElementById('status-message') as HTMLSpanElement;

const toggleAutoCopy = document.getElementById('toggle-auto-copy') as HTMLInputElement;
const toggleAutoDownload = document.getElementById('toggle-auto-download') as HTMLInputElement;
const toggleOpenWebapp = document.getElementById('toggle-open-webapp') as HTMLInputElement;
const toggleHostname = document.getElementById('toggle-hostname') as HTMLInputElement;
const selectFormat = document.getElementById('select-format') as HTMLSelectElement;
const inputWebappUrl = document.getElementById('input-webapp-url') as HTMLInputElement;

// ─── Initialisation ────────────────────────────────────────────────────────

loadSettings();

// ─── Event Handlers ────────────────────────────────────────────────────────

btnVisible.addEventListener('click', () => {
  sendCapture('CAPTURE_VISIBLE');
});

btnFullpage.addEventListener('click', () => {
  sendCapture('CAPTURE_FULLPAGE');
});

btnSelection.addEventListener('click', () => {
  sendCapture('CAPTURE_SELECTION');
  window.close(); // close popup so selection overlay is visible
});

btnSettingsToggle.addEventListener('click', () => {
  const hidden = sectionSettings.hasAttribute('hidden');
  if (hidden) {
    sectionSettings.removeAttribute('hidden');
    btnSettingsToggle.classList.add('active');
  } else {
    sectionSettings.setAttribute('hidden', '');
    btnSettingsToggle.classList.remove('active');
  }
});

btnSaveSettings.addEventListener('click', () => {
  saveSettings();
});

linkShortcuts.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// ─── Capture ────────────────────────────────────────────────────────────────

async function sendCapture(type: ExtensionMessage['type']): Promise<void> {
  setCapturingState(true);
  try {
    await chrome.runtime.sendMessage({ type } as ExtensionMessage);
    if (type !== 'CAPTURE_SELECTION') {
      showStatus('Capture initiated!', 'success');
      setTimeout(() => window.close(), 1200);
    }
  } catch (err) {
    showStatus(`Error: ${String(err)}`, 'error');
    setCapturingState(false);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  const result = await chrome.storage.local.get('settings');
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(result['settings'] ?? {}) };
  applySettings(settings);
}

async function saveSettings(): Promise<void> {
  const settings: Settings = {
    autoCopy: toggleAutoCopy.checked,
    autoDownload: toggleAutoDownload.checked,
    openWebApp: toggleOpenWebapp.checked,
    includeHostname: toggleHostname.checked,
    format: selectFormat.value as 'png' | 'jpg',
    quality: 92,
    webAppUrl: inputWebappUrl.value.trim() || DEFAULT_SETTINGS.webAppUrl,
  };
  await chrome.storage.local.set({ settings });
  showStatus('Settings saved!', 'success');
}

function applySettings(settings: Settings): void {
  toggleAutoCopy.checked = settings.autoCopy;
  toggleAutoDownload.checked = settings.autoDownload;
  toggleOpenWebapp.checked = settings.openWebApp;
  toggleHostname.checked = settings.includeHostname;
  selectFormat.value = settings.format;
  inputWebappUrl.value = settings.webAppUrl;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function setCapturingState(capturing: boolean): void {
  [btnVisible, btnFullpage, btnSelection].forEach((btn) => {
    btn.disabled = capturing;
  });
}

let statusTimeout: ReturnType<typeof setTimeout> | null = null;
function showStatus(message: string, variant: 'success' | 'error' | 'info'): void {
  statusBar.removeAttribute('hidden');
  statusMessage.textContent = message;
  statusBar.className = `status-bar status-${variant}`;

  if (statusTimeout) clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    statusBar.setAttribute('hidden', '');
  }, 3000);
}
