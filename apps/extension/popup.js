(function () {
  const SERVER_URL = "http://localhost:8787"; // TODO: update to your Lynkr server URL
  let currentTabUrl = "";
  let folders = [];

  function switchTab(tab) {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
    document.getElementById(`${tab}-section`).classList.add("active");
  }

  async function loadFolders() {
    try {
      const { lynkrToken } = await chrome.storage.sync.get(["lynkrToken"]);
      const res = await fetch(`${SERVER_URL}/api/folders`, {
        headers: lynkrToken ? { Authorization: `Bearer ${lynkrToken}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch folders");
      folders = await res.json();
      const select = document.getElementById("folder-select");
      select.innerHTML = "";
      folders.forEach((f) => {
        const option = document.createElement("option");
        option.value = f.id;
        option.textContent = `${f.icon ?? ""} ${f.name}`;
        select.appendChild(option);
      });

      // Store default when user changes drop-down
      select.addEventListener("change", (e) => {
        chrome.storage.sync.set({ lynkrDefaultFolder: select.value });
      });

      // Preselect stored default
      const { lynkrDefaultFolder } = await chrome.storage.sync.get([
        "lynkrDefaultFolder",
      ]);
      if (lynkrDefaultFolder) select.value = lynkrDefaultFolder;
    } catch (err) {
      console.error(err);
      document.getElementById("status").textContent = "Error loading folders";
    }
  }

  async function captureScreenshot() {
    return new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(
        null,
        { format: "jpeg", quality: 30 },
        (dataUrl) => {
          resolve(dataUrl);
        }
      );
    });
  }

  async function saveBookmark() {
    const folderId = document.getElementById("folder-select").value;
    const { lynkrToken } = await chrome.storage.sync.get(["lynkrToken"]);
    const screenshot = await captureScreenshot();

    const res = await fetch(`${SERVER_URL}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(lynkrToken ? { Authorization: `Bearer ${lynkrToken}` } : {}),
      },
      body: JSON.stringify({
        url: currentTabUrl,
        folderId,
        ogImageUrl: screenshot,
      }),
    });

    if (res.status === 409) {
      document.getElementById("status").textContent = "Already bookmarked!";
      return;
    }
    if (res.status === 401) {
      // Invalid token
      chrome.storage.sync.remove("lynkrToken");
      switchTab("signin");
      document.getElementById("status").textContent = "Please sign in again.";
      return;
    }
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || "Unknown error");
    }
    document.getElementById("status").textContent = "Bookmark saved!";
    setTimeout(() => window.close(), 800); // auto-close
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Tab switching
    document
      .getElementById("tab-save")
      .addEventListener("click", () => switchTab("save"));
    document
      .getElementById("tab-signin")
      .addEventListener("click", () => switchTab("signin"));

    // Get the active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        document.getElementById("status").textContent =
          "Unable to detect active tab";
        return;
      }
      currentTabUrl = tab.url || "";
      document.getElementById("status").textContent = currentTabUrl;
    });

    // Load folders asynchronously (best-effort)
    loadFolders();

    // Save bookmark button
    document.getElementById("add").addEventListener("click", () => {
      if (!currentTabUrl) return;
      saveBookmark().catch((err) => {
        console.error(err);
        document.getElementById("status").textContent = `Error: ${err.message}`;
      });
    });

    // Store token button
    document.getElementById("saveToken").addEventListener("click", async () => {
      const token = document.getElementById("tokenInput").value.trim();
      if (!token) return;
      chrome.storage.sync.set({ lynkrToken: token }, () => {
        switchTab("save");
        loadFolders();
      });
    });
  });
})();
