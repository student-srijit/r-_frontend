const CONTEXT_MENU_ID = "analyzeLink";

async function ensureContextMenu() {
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Analyze with Research Plus",
      contexts: ["link"],
    });
  } catch (error) {
    console.error("Failed to initialize context menu:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenu();
});

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    const linkUrl = info.linkUrl;

    // Store the link URL for the popup to use
    await chrome.storage.local.set({ contextMenuUrl: linkUrl });

    // Open the popup
    await chrome.action.openPopup();
  }
});

// Message handler for communication between content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getContextUrl") {
    chrome.storage.local.get("contextMenuUrl", (result) => {
      sendResponse({ url: result.contextMenuUrl });
      chrome.storage.local.remove("contextMenuUrl");
    });
    return true;
  }
});
