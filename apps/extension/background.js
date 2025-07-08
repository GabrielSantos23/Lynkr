chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SET_LYNKR_TOKEN") {
    chrome.storage.sync.set({ lynkrToken: message.token }, () => {
      console.log("Lynkr token stored");
    });
  }
  if (message?.type === "SET_LYNKR_FOLDER") {
    chrome.storage.sync.set({ lynkrDefaultFolder: message.folderId }, () => {
      console.log("Default Lynkr folder stored");
    });
  }
  return true; // Keep port alive for async
});

// Constant Lynkr backend URL – keep in sync with popup.js
const SERVER_URL = "https://zyvon-server.gabriel-gs605.workers.dev";
// URL of the Lynkr web app (used for OAuth sign-in). Update if hosted elsewhere.
const WEB_URL = "https://your-lynkr-frontend.example.com";

async function getAuthAndFolder() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["lynkrToken", "lynkrDefaultFolder"], (items) => {
      resolve({
        token: items.lynkrToken || "",
        folderId: items.lynkrDefaultFolder || "",
      });
    });
  });
}

async function saveBookmark(url, tabId) {
  const { token, folderId } = await getAuthAndFolder();

  // Capture screenshot thumbnail
  const screenshotUrl = await new Promise((res) => {
    chrome.tabs.captureVisibleTab(
      null,
      { format: "jpeg", quality: 30 },
      (dataUrl) => {
        res(dataUrl);
      }
    );
  });

  await fetch(`${SERVER_URL}/api/bookmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url, folderId, ogImageUrl: screenshotUrl }),
  })
    .then(async (resp) => {
      if (resp.status === 409) {
        const { message } = await resp.json();
        chrome.notifications.create({
          type: "basic",
          iconUrl: "logo.png",
          title: "Duplicate bookmark",
          message: message || "Already exists in Lynkr",
        });
        return;
      }
      if (!resp.ok) {
        if (resp.status === 401) {
          // Clear invalid token
          chrome.storage.sync.remove("lynkrToken");
        }
        const { message } = await resp.json();
        chrome.notifications.create({
          type: "basic",
          iconUrl: "logo.png",
          title: "Error saving bookmark",
          message: message || "Unknown error",
        });
        return;
      }
      chrome.notifications.create({
        type: "basic",
        iconUrl: "logo.png",
        title: "Saved to Lynkr!",
        message: url,
      });
    })
    .catch((err) => {
      console.error(err);
    });
}

// Create context menu at install / update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save_to_lynkr",
    title: "Add link to Lynkr",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "save_page_to_lynkr",
    title: "Add page to Lynkr",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save_to_lynkr") {
    saveBookmark(info.linkUrl, tab.id);
  }
  if (info.menuItemId === "save_page_to_lynkr") {
    saveBookmark(info.pageUrl, tab.id);
  }
});

// Keyboard shortcut command
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "save_page" && tab?.url) {
    saveBookmark(tab.url, tab.id);
  }
});

// Detect when user logs in via Lynkr web and extract token automatically
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (
    info.status === "complete" &&
    tab.url &&
    (tab.url.startsWith(SERVER_URL) || tab.url.startsWith(WEB_URL))
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          const token = localStorage.getItem("better-auth-session-token");
          if (token) {
            chrome.runtime.sendMessage({ type: "SET_LYNKR_TOKEN", token });
          }
        } catch (e) {
          // ignore cross-origin access errors
        }
      },
    });
  }
});
