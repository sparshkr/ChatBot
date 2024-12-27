console.log("AI Assistant Extension loaded");

class ChatbotManager {
  constructor() {
    this.chatbotInjected = false;
    this.currentPath = "";
    this.aiChat = null;
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
      const chatContainer = document.getElementById("chat-container");

      if (targetElement && chatContainer) {
        if (targetElement.lastElementChild !== chatContainer.parentElement) {
          console.log("Reordering chat to bottom");
          this.moveToBottom(targetElement);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  moveToBottom(targetElement) {
    const container = document.getElementById("chat-container")?.parentElement;
    const askAiBtn = document.getElementById("ask-ai-btn");

    if (container) {
      targetElement.appendChild(container);
    } else if (askAiBtn) {
      const newContainer = document.createElement("div");
      newContainer.appendChild(askAiBtn);
      targetElement.appendChild(newContainer);
    }
  }

  async handleUrlChange() {
    const newPath = window.location.pathname;
    console.log("URL changed to:", newPath);

    // Clean up old instance if exists
    if (this.aiChat) {
      await this.cleanupAIChat();
    }

    if (newPath.startsWith("/problems/")) {
      this.removeChatbot();
      await this.injectChatbot();
    } else {
      this.removeChatbot();
    }

    this.currentPath = newPath;
  }

  async cleanupAIChat() {
    if (this.aiChat) {
      // Remove event listeners
      this.aiChat.cleanup();
      this.aiChat = null;
    }
  }

  repositionChatbot(targetElement) {
    const chatContainer = document.getElementById("chat-container");
    const askAiBtn = document.getElementById("ask-ai-btn");
    const container = document.createElement("div");

    if (chatContainer && askAiBtn) {
      container.appendChild(chatContainer);
      container.appendChild(askAiBtn);
      targetElement.appendChild(container);
    } else {
      this.createChatbotElements(targetElement);
    }
  }

  removeChatbot() {
    const chatContainer = document.getElementById("chat-container");
    const askAiBtn = document.getElementById("ask-ai-btn");

    if (chatContainer) {
      chatContainer.remove();
    }
    if (askAiBtn) {
      askAiBtn.remove();
    }

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

  async injectChatbot() {
    return new Promise((resolve) => {
      const waitForElement = setInterval(() => {
        const mainco = document.querySelector(
          ".coding_leftside_scroll__CMpky.pb-5"
        );
        if (mainco) {
          clearInterval(waitForElement);
          this.createChatbotElements(mainco);
          resolve();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(waitForElement);
        resolve();
      }, 10000);
    });
  }

  createChatbotElements(mainco) {
    if (document.getElementById("chat-container")) {
      return;
    }

    this.injectStyles();

    const container = document.createElement("div");
    container.innerHTML = `
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
      <button id="ask-ai-btn" class="pulse">Ask AI</button>
    `;

    mainco.appendChild(container);
    this.initializeChatFunctionality();
    this.chatbotInjected = true;

    // Inject script.js into the webpage
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("script.js");
    script.onload = () => {
      // After script loads, create AIChat instance via a custom event
      const event = new CustomEvent("initAIChat");
      document.dispatchEvent(event);
    };
    (document.head || document.documentElement).appendChild(script);

    // Listen for AIChat instance creation
    document.addEventListener("aiChatCreated", (event) => {
      console.log("AIChat instance created");
    });
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
