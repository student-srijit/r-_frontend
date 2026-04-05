// Runtime-configurable URLs — users set these in Settings
const DEFAULT_API_URL = "http://localhost:5001/api";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

// Provider → default model map
const PROVIDER_DEFAULTS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  gemini: "gemini-1.5-flash",
  groq: "llama-3.1-8b-instant",
  together: "meta-llama/Llama-3-8b-chat-hf",
  deepinfra: "meta-llama/Meta-Llama-3-8B-Instruct",
  openrouter: "openai/gpt-4o-mini",
  mistral: "mistral-small-latest",
  perplexity: "llama-3.1-sonar-small-128k-online",
  custom: "",
};

// DOM Elements
const authStatus = document.getElementById("authStatus");
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const messageContainer = document.getElementById("messageContainer");
const linkUrlInput = document.getElementById("linkUrl");
const researchList = document.getElementById("researchList");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const newResearchBtn = document.getElementById("newResearchBtn");
const apiKeyInput = document.getElementById("apiKey");
const providerSelect = document.getElementById("provider");
const modelNameInput = document.getElementById("modelName");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const signUpLink = document.getElementById("signUpLink");
const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const settingsApiUrlInput = document.getElementById("settingsApiUrl");
const settingsFrontendUrlInput = document.getElementById("settingsFrontendUrl");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const syncFromWebsiteBtn = document.getElementById("syncFromWebsiteBtn");
const syncStatus = document.getElementById("syncStatus");
const analysisResultSection = document.getElementById("analysisResultSection");
const analysisResultContent = document.getElementById("analysisResultContent");

let currentResearchId = null;
let currentToken = null;
let apiBaseUrl = DEFAULT_API_URL;
let frontendUrl = DEFAULT_FRONTEND_URL;
let syncedBaseUrl = "";

const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Settings panel toggle
toggleSettingsBtn.addEventListener("click", () => {
  const hidden = settingsPanel.style.display === "none";
  settingsPanel.style.display = hidden ? "block" : "none";
  toggleSettingsBtn.textContent = hidden ? "Hide" : "Show";
});

syncFromWebsiteBtn.addEventListener("click", async () => {
  syncFromWebsiteBtn.disabled = true;
  syncFromWebsiteBtn.textContent = "Syncing...";

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const appTab = tabs[0];

    if (
      !appTab ||
      !appTab.id ||
      !appTab.url ||
      !appTab.url.startsWith(frontendUrl)
    ) {
      showMessage("Open website tab as active tab, then click sync", "error");
      syncStatus.textContent = "Active tab is not website";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: appTab.id },
      func: (frontend) => {
        const getState = (key) => {
          const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            return parsed?.state || null;
          } catch {
            return null;
          }
        };

        if (!location.href.startsWith(frontend)) {
          return { ok: false, reason: "Wrong tab selected for sync" };
        }

        const authState = getState("auth-store");
        const llmState = getState("llm-session-credentials");

        const token =
          authState?.token || localStorage.getItem("authToken") || null;
        const credentials = llmState?.credentials || null;

        return { ok: true, token, credentials };
      },
      args: [frontendUrl],
    });

    const syncData = results?.[0]?.result;
    if (!syncData?.ok) {
      showMessage(
        syncData?.reason || "Failed to read website session",
        "error",
      );
      return;
    }

    if (syncData.token) {
      currentToken = syncData.token;
      await chrome.storage.local.set({ authToken: syncData.token });
      await checkAuth();
      await loadResearchWorks();
    }

    if (syncData.credentials) {
      providerSelect.value =
        syncData.credentials.provider || providerSelect.value;
      modelNameInput.value = syncData.credentials.model || modelNameInput.value;
      apiKeyInput.value = syncData.credentials.apiKey || "";
      syncedBaseUrl = syncData.credentials.baseUrl || "";
      if (syncData.credentials.baseUrl) {
        // Keep base URL as part of model hint for custom provider users
        modelNameInput.title = `Base URL: ${syncData.credentials.baseUrl}`;
      }
      syncStatus.textContent = `Synced: ${providerSelect.value}/${modelNameInput.value}`;
      showMessage("Website session synced successfully", "success");
    } else {
      syncStatus.textContent = "No LLM credentials found on website session";
      showMessage("Logged in synced, but no saved API config found", "info");
    }
  } catch (error) {
    showMessage("Sync failed: " + error.message, "error");
    syncStatus.textContent = "Sync failed";
  } finally {
    syncFromWebsiteBtn.disabled = false;
    syncFromWebsiteBtn.textContent = "Use Saved Session From Website";
  }
});
// Auto-fill model when provider changes
providerSelect.addEventListener("change", () => {
  const defaultModel = PROVIDER_DEFAULTS[providerSelect.value] || "";
  modelNameInput.value = defaultModel;
  modelNameInput.placeholder = defaultModel || "Enter model name";
});

// Save settings
saveSettingsBtn.addEventListener("click", async () => {
  const newApiUrl = settingsApiUrlInput.value.trim();
  const newFrontendUrl = settingsFrontendUrlInput.value.trim();

  if (!newApiUrl || !newFrontendUrl) {
    showMessage("Both URLs are required", "error");
    return;
  }

  try {
    new URL(newApiUrl);
    new URL(newFrontendUrl);
  } catch {
    showMessage("Invalid URL format", "error");
    return;
  }

  await chrome.storage.local.set({
    apiBaseUrl: newApiUrl,
    frontendUrl: newFrontendUrl,
  });
  apiBaseUrl = newApiUrl;
  frontendUrl = newFrontendUrl;
  signUpLink.href = frontendUrl + "/register";
  showMessage("Settings saved", "success");
  settingsPanel.style.display = "none";
  toggleSettingsBtn.textContent = "Show";
});

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Load persisted settings
  const stored = await chrome.storage.local.get(["apiBaseUrl", "frontendUrl"]);
  if (stored.apiBaseUrl) {
    apiBaseUrl = stored.apiBaseUrl;
    settingsApiUrlInput.value = stored.apiBaseUrl;
  } else {
    settingsApiUrlInput.value = DEFAULT_API_URL;
  }
  if (stored.frontendUrl) {
    frontendUrl = stored.frontendUrl;
    settingsFrontendUrlInput.value = stored.frontendUrl;
  } else {
    settingsFrontendUrlInput.value = DEFAULT_FRONTEND_URL;
  }
  signUpLink.href = frontendUrl + "/register";

  // Set default model for initial provider
  modelNameInput.value = PROVIDER_DEFAULTS[providerSelect.value] || "";

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url) {
    linkUrlInput.value = tab.url;
  }

  // Check authentication
  await checkAuth();
  await loadResearchWorks();
});

async function checkAuth() {
  const token = await chrome.storage.local.get("authToken");
  currentToken = token.authToken;

  if (currentToken) {
    authStatus.classList.add("authenticated");
    authStatus.innerHTML = '<div class="status-text">✓ Logged in</div>';
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
  } else {
    authStatus.classList.remove("authenticated");
    authStatus.innerHTML = '<div class="status-text">Not logged in</div>';
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
  }
}

async function loadResearchWorks() {
  if (!currentToken) return;

  try {
    const response = await fetch(`${apiBaseUrl}/research?limit=50`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    const data = await response.json();

    if (data.success && data.data) {
      const researches = Array.isArray(data.data?.data)
        ? data.data.data
        : Array.isArray(data.data)
          ? data.data
          : [];

      if (researches.length === 0) {
        researchList.innerHTML =
          '<div style="padding: 8px; color: #666; font-size: 11px">No research works. Create one to get started.</div>';
        return;
      }

      researchList.innerHTML = researches
        .map(
          (r) => `
        <div class="research-item" data-id="${r._id}">
          <div class="research-item-title">${r.title}</div>
          <div class="research-item-meta">${r.field} • ${r.links.length} links</div>
        </div>
      `,
        )
        .join("");

      // Add click handlers
      document.querySelectorAll(".research-item").forEach((item) => {
        item.addEventListener("click", () => {
          currentResearchId = item.dataset.id;
          researchList.querySelectorAll(".research-item").forEach((i) => {
            i.style.background = i === item ? "#f3f4f6" : "#f9fafb";
          });
        });
      });
    }
  } catch (error) {
    console.error("Error loading research:", error);
  }
}

// Event listeners
loginBtn.addEventListener("click", async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      currentToken = data.data.token;
      await chrome.storage.local.set({ authToken: currentToken });
      loginEmailInput.value = "";
      loginPasswordInput.value = "";
      showMessage("Login successful!", "success");
      await checkAuth();
      await loadResearchWorks();
    } else {
      showMessage(data.message || "Login failed", "error");
    }
  } catch (error) {
    showMessage("Error: " + error.message, "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

logoutBtn.addEventListener("click", async () => {
  currentToken = null;
  currentResearchId = null;
  await chrome.storage.local.remove("authToken");
  await checkAuth();
  showMessage("Logged out", "info");
});

analyzeBtn.addEventListener("click", async () => {
  if (!currentResearchId) {
    showMessage("Please select a research work", "error");
    return;
  }

  const url = linkUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const provider = providerSelect.value;
  const model = modelNameInput.value.trim();

  if (!url || !apiKey) {
    showMessage("Please enter URL and API key", "error");
    return;
  }

  if (!model) {
    showMessage("Please enter a model name", "error");
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="loading"></span> Analyzing...';

  try {
    const body = {
      researchWorkId: currentResearchId,
      linkUrl: url,
      apiKey,
      provider,
      model,
      ...(provider === "custom" && syncedBaseUrl
        ? { baseUrl: syncedBaseUrl }
        : {}),
    };

    const response = await fetch(`${apiBaseUrl}/analyze/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.success) {
      showMessage("Analysis complete!", "success");
      renderAnalysisResult(data.data);
    } else {
      showMessage(data.message || "Analysis failed", "error");
    }
  } catch (error) {
    showMessage("Error: " + error.message, "error");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = "Analyze";
  }
});

newResearchBtn.addEventListener("click", () => {
  chrome.tabs.create({
    url: frontendUrl + "/research/new",
  });
});

function renderList(items = [], ordered = false) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<div style="font-size:10px;color:#666;">Not available</div>';
  }

  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</${tag}>`;
}

function renderAnalysisResult(payload = {}) {
  const url = payload.url || "";
  const type = payload.contentType || "other";
  const analysis = payload.analysis || {};

  analysisResultContent.innerHTML = `
    <div class="result-block">
      <h4>${escapeHtml(type.toUpperCase())}</h4>
      <div style="font-size:10px;color:#666;word-break:break-all;">${escapeHtml(url)}</div>
    </div>
    <div class="result-block">
      <h4>Detailed Summary</h4>
      <div>${escapeHtml(analysis.summary || "No summary")}</div>
    </div>
    <div class="result-block">
      <h4>Key Points</h4>
      ${renderList(analysis.keyPoints)}
    </div>
    <div class="result-block">
      <h4>Important Concepts</h4>
      ${renderList(analysis.importantConcepts)}
    </div>
    <div class="result-block">
      <h4>Practical Applications</h4>
      ${renderList(analysis.practicalApplications)}
    </div>
    <div class="result-block">
      <h4>Discussion Questions</h4>
      ${renderList(analysis.discussionQuestions, true)}
    </div>
  `;

  analysisResultSection.classList.remove("hidden");
}

function showMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  messageContainer.innerHTML = "";
  messageContainer.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 4000);
}
