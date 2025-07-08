# Lynkr Browser Extension

This folder contains a minimal Manifest v3 browser extension that lets you quickly add the current tab to your Lynkr bookmarks.

## Getting started

1. Make sure your Lynkr server is up and running locally (update `SERVER_URL` in `popup.js` if it's hosted elsewhere).
2. Open your browser's extensions page and enable _Developer mode_.
   - **Chrome / Edge**: `chrome://extensions`
   - **Firefox (Nightly)**: `about:debugging#/runtime/this-firefox`
3. Click **Load unpacked** and select this `apps/extension` directory.
4. Log in to Lynkr in a normal browser tab so you have a valid session token.
5. In the browser console you can pass your auth token to the extension:

```js
chrome.runtime.sendMessage({
  type: "SET_LYNKR_TOKEN",
  token: localStorage.getItem("better-auth-session-token"),
});
```

6. (Optional) Store a default folder ID for new bookmarks:

```js
chrome.runtime.sendMessage({
  type: "SET_LYNKR_FOLDER",
  folderId: "<your-folder-id>",
});
```

7. Click the Lynkr icon in the toolbar, then **Save current page** to add a bookmark.

---

Feel free to evolve this extension (add React, TypeScript, OAuth flows, etc.) – this is only a starting point.
