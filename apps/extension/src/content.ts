// Content script for Lynkr Extension
console.log("Lynkr Extension content script loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getCurrentPage") {
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      description: getPageDescription(),
    };
    sendResponse(pageInfo);
  }
});

function getPageDescription(): string {
  // Try to get meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    return metaDescription.getAttribute("content") || "";
  }

  // Fallback to first paragraph
  const firstParagraph = document.querySelector("p");
  if (firstParagraph) {
    return firstParagraph.textContent?.slice(0, 200) || "";
  }

  return "";
}
