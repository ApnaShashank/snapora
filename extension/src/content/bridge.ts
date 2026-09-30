/**
 * Content Script: Web App Bridge
 *
 * Injected into FullPagePrint web application routes at document_start.
 * Facilitates instant two-way handshake between web app and extension.
 */

(() => {
  function getCaptureIdFromUrl(): string | null {
    const match = window.location.pathname.match(/\/capture\/([a-f0-9]{32})/);
    return match ? match[1] : null;
  }

  async function fetchAndPost(id: string): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CAPTURE',
        id,
      });

      window.postMessage(
        {
          source: 'capture-extension',
          type: 'CAPTURE_BRIDGE_DATA',
          record: response?.record ?? null,
          expired: response?.expired === true,
        },
        '*'
      );
    } catch (err) {
      console.warn('[Bridge] Error fetching capture:', err);
    }
  }

  // 1. Listen for requests from the web app (PING_EXTENSION and REQUEST_CAPTURE_DATA)
  window.addEventListener('message', async (event) => {
    if (event.data?.source === 'capture-webapp') {
      if (event.data?.type === 'PING_EXTENSION') {
        window.postMessage(
          {
            source: 'capture-extension',
            type: 'EXTENSION_PONG',
            version: '1.2.0',
            installed: true,
          },
          '*'
        );
        return;
      }

      if (event.data?.type === 'REQUEST_CAPTURE_DATA') {
        const id = event.data?.id || getCaptureIdFromUrl();
        if (id) {
          await fetchAndPost(id);
        }
      }
    }
  });

  // 2. Announce presence on load
  window.postMessage(
    {
      source: 'capture-extension',
      type: 'EXTENSION_PONG',
      version: '1.2.0',
      installed: true,
    },
    '*'
  );

  // 3. Immediate fetch if on capture page
  const initialId = getCaptureIdFromUrl();
  if (initialId) {
    fetchAndPost(initialId);
    setTimeout(() => fetchAndPost(initialId), 100);
    setTimeout(() => fetchAndPost(initialId), 400);
    setTimeout(() => fetchAndPost(initialId), 1000);
  }
})();
