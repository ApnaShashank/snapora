/**
 * Content Script: Web App Bridge
 *
 * Injected into the Capture web app pages.
 * Reads capture data from chrome.storage.local and posts it to the page
 * via window.postMessage.
 *
 * The web app listens for the 'CAPTURE_BRIDGE_DATA' message.
 */

(async () => {
  // Extract capture ID from URL
  const match = window.location.pathname.match(/\/capture\/([a-f0-9]{32})/);
  if (!match) return;

  const captureId = match[1];

  try {
    // Request capture data from the service worker
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CAPTURE',
      id: captureId,
    });

    // Post to the web app page
    window.postMessage(
      {
        source: 'capture-extension',
        type: 'CAPTURE_BRIDGE_DATA',
        record: response?.record ?? null,
      },
      '*'
    );
  } catch (err) {
    console.error('[Capture Bridge] Failed to retrieve capture:', err);
    window.postMessage(
      {
        source: 'capture-extension',
        type: 'CAPTURE_BRIDGE_DATA',
        record: null,
        error: String(err),
      },
      '*'
    );
  }
})();
