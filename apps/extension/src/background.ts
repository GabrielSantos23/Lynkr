// Minimal background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
  // noop: ensure file exists for Vite build
});
