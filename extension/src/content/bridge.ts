/**
 * Content Script: Web App Bridge
 *
 * Injected into the Capture web app pages.
 * Facilitates two-way communication between the web app and extension:
 * 1. Automatically fetches capture data from service worker on load and posts to window
 * 2. Listens for 'REQUEST_CAPTURE_DATA' from the page and replies immediately
 */

(async () => {
  const match = window.location.pathname.match(/\/capture\/([a-f0-9]{32})/);
  if (!match) return;

  const captureId = match[1];
  let cachedRecord: unknown = null;

  async function fetchAndPost(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CAPTURE',
        id: captureId,
      });

      if (response?.record) {
        cachedRecord = response.record;
      }

      window.postMessage(
        {
          source: 'capture-extension',
          type: 'CAPTURE_BRIDGE_DATA',
          record: response?.record ?? cachedRecord ?? null,
          expired: response?.expired === true,
        },
        '*'
      );
    } catch (err) {
      console.warn('[Capture Bridge] Error fetching capture:', err);
      if (cachedRecord) {
        window.postMessage(
          {
            source: 'capture-extension',
            type: 'CAPTURE_BRIDGE_DATA',
            record: cachedRecord,
            expired: false,
          },
          '*'
        );
      }
    }
  }

  // 1. Listen for requests from the web app page (two-way handshake)
  window.addEventListener('message', (event) => {
    if (
      event.data?.source === 'capture-webapp' &&
      event.data?.type === 'REQUEST_CAPTURE_DATA'
    ) {
      if (cachedRecord) {
        window.postMessage(
          {
            source: 'capture-extension',
            type: 'CAPTURE_BRIDGE_DATA',
            record: cachedRecord,
            expired: false,
          },
          '*'
        );
      } else {
        fetchAndPost();
      }
    }
  });

  // 2. Fetch immediately
  await fetchAndPost();

  // 3. Staggered retries in case React mounts after initial load
  setTimeout(fetchAndPost, 150);
  setTimeout(fetchAndPost, 500);
  setTimeout(fetchAndPost, 1200);
})();
