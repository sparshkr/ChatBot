// content.js
// content.js
console.log("AI Assistant Extension loaded");

// Add message listener for API key requests
window.addEventListener("message", async function (event) {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === "GET_API_KEY") {
    // Get API key from chrome.storage
    chrome.storage.sync.get(["aiApiKey"], function (result) {
      window.postMessage(
        {
          type: "API_KEY_RESULT",
          apiKey: result.aiApiKey,
        },
        "*"
      );
    });
  }
});

class ChatbotManager {
  constructor() {
    this.chatbotInjected = false;
    this.currentPath = "";
    this.setupUrlMonitoring();
    this.setupDOMMonitoring();
  }
  setupUrlMonitoring() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (lastUrl !== location.href) {
        lastUrl = location.href;
        this.handleUrlChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.handleUrlChange();
  }

  setupDOMMonitoring() {
    const observer = new MutationObserver((mutations) => {
      if (!this.currentPath.startsWith("/problems/")) return;

      const targetElement = document.querySelector(
        ".coding_leftside_scroll__CMpky.pb-5"
      );

      if (targetElement && !document.getElementById("chat-container")) {
        this.createChatbotElements(targetElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  handleUrlChange() {
    const newPath = window.location.pathname;
    console.log("URL changed to:", newPath);

    if (newPath.startsWith("/problems/")) {
      const targetElement = document.querySelector(
        ".coding_leftside_scroll__CMpky.pb-5"
      );
      if (targetElement) {
        this.createChatbotElements(targetElement);
        // Trigger chat reset when URL changes
        document.dispatchEvent(new CustomEvent("resetAIChat"));
      }
    } else {
      this.removeChatbot();
    }

    this.currentPath = newPath;
  }

  removeChatbot() {
    const chatContainer = document.getElementById("chat-container");
    const askAiBtn = document.getElementById("ask-ai-btn");
    const existingScript = document.querySelector('script[src*="script.js"]');

    if (chatContainer) chatContainer.remove();
    if (askAiBtn) askAiBtn.remove();
    if (existingScript) existingScript.remove();

    this.chatbotInjected = false;
  }

  injectStyles() {
    if (!document.getElementById("ai-assistant-styles")) {
      const styleLink = document.createElement("link");
      styleLink.id = "ai-assistant-styles";
      styleLink.rel = "stylesheet";
      styleLink.type = "text/css";
      styleLink.href = chrome.runtime.getURL("style.css");
      document.head.appendChild(styleLink);
    }
  }

  createChatbotElements(mainco) {
    if (document.getElementById("chat-container")) {
      return;
    }

    console.log("Creating chatbot elements");
    this.injectStyles();

    const wrapper = document.createElement("div");
    wrapper.style.paddingTop = "20px";
    wrapper.style.position = "relative";

    wrapper.innerHTML = `
      <div id="chat-container" class="hidden">
        <div id="chat-header">
          <h3>AI Coding Assistant</h3>
          <button id="close-chat" class="close-btn">&times;</button>
        </div>
        <div id="chat-messages"></div>
        <div id="chat-input-container">
          <textarea id="user-input" placeholder="Ask me about your code..."></textarea>
          <button id="send-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <button id="ask-ai-btn">Ask AI</button>
    `;

    mainco.appendChild(wrapper);

    // First inject marked.js
    const markedScript = document.createElement("script");
    markedScript.src = chrome.runtime.getURL("marked.min.js");
    markedScript.onload = () => {
      // After marked.js is loaded, inject script.js
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("script.js");
      script.onload = () => {
        const event = new CustomEvent("initAIChat");
        document.dispatchEvent(event);
      };
      (document.head || document.documentElement).appendChild(script);
    };
    (document.head || document.documentElement).appendChild(markedScript);

    this.initializeChatFunctionality();
    this.chatbotInjected = true;
  }

  initializeChatFunctionality() {
    const chatContainer = document.getElementById("chat-container");
    const askAiBtn = document.getElementById("ask-ai-btn");
    const closeBtn = document.getElementById("close-chat");

    if (askAiBtn && chatContainer && closeBtn) {
      askAiBtn.addEventListener("click", () => {
        chatContainer.classList.remove("hidden");
        askAiBtn.classList.add("hidden");
        const mainco = document.querySelector(
          ".coding_leftside_scroll__CMpky.pb-5"
        );
        if (mainco) {
          mainco.scrollTop = mainco.scrollHeight;
        }
      });

      closeBtn.addEventListener("click", () => {
        chatContainer.classList.add("hidden");
        askAiBtn.classList.remove("hidden");
      });
    }
  }
}

// Initialize the manager
const chatbotManager = new ChatbotManager();
