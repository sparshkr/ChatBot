console.log("AI Assistant Extension loaded");

function injectStyles() {
  // Inject main styles
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.type = "text/css";
  styleLink.href = chrome.runtime.getURL("style.css");
  document.head.appendChild(styleLink);

  // Inject marked and highlight.js scripts from local files
  const markedScript = document.createElement("script");
  markedScript.src = chrome.runtime.getURL("marked.min.js");
  document.head.appendChild(markedScript);

  const highlightScript = document.createElement("script");
  highlightScript.src = chrome.runtime.getURL("highlight.min.js");
  document.head.appendChild(highlightScript);
}

function injectChatbot() {
  const mainco = document.querySelector(".coding_leftside_scroll__CMpky.pb-5");

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
  initializeChatFunctionality();
}

function initializeChatFunctionality() {
  const chatContainer = document.getElementById("chat-container");
  const askAiBtn = document.getElementById("ask-ai-btn");
  const closeBtn = document.getElementById("close-chat");

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

injectStyles();
injectChatbot();

const script = document.createElement("script");
script.type = "module";
script.src = chrome.runtime.getURL("script.js");
document.body.appendChild(script);
