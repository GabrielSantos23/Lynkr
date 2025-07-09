(function () {
  const SERVER_URL = "https://zyvon-server.gabriel-gs605.workers.dev";
  const WEB_URL = "https://your-zyven-frontend.example.com";
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
      const { lynkrToken } = await chrome.storage.sync.get(["lynkrToken"]); // Using legacy storage key
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

      select.addEventListener("change", (e) => {
        chrome.storage.sync.set({ lynkrDefaultFolder: select.value });
      });

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
    document
      .getElementById("tab-save")
      .addEventListener("click", () => switchTab("save"));
    document
      .getElementById("tab-signin")
      .addEventListener("click", () => switchTab("signin"));

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

    loadFolders();

    document.getElementById("add").addEventListener("click", () => {
      if (!currentTabUrl) return;
      saveBookmark().catch((err) => {
        console.error(err);
        document.getElementById("status").textContent = `Error: ${err.message}`;
      });
    });

    document.getElementById("loginGoogle").addEventListener("click", () => {
      chrome.tabs.create({ url: `${WEB_URL}/login?provider=google` });
    });
    document.getElementById("loginGithub").addEventListener("click", () => {
      chrome.tabs.create({ url: `${WEB_URL}/login?provider=github` });
    });
  });
})();
