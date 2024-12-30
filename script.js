if (!window.AIChat) {
  window.AIChat = class AIChat {
    constructor() {
      this.messagesContainer = document.getElementById("chat-messages");
      this.userInput = document.getElementById("user-input");
      this.sendButton = document.getElementById("send-message");
      this.conversationHistory = [];
      this.problemData = null;
      this.userCode = null;
      this.studentId = null;
      this.isMarkedReady = false;
      this.markedErrorShown = false;

      this.sendMessage = this.sendMessage.bind(this);
      this.handleKeyPress = this.handleKeyPress.bind(this);
      this.cleanup = this.cleanup.bind(this);
      this.resetChat = this.resetChat.bind(this);

      document.addEventListener("resetAIChat", this.resetChat);
      this.setupEventListeners();
      this.initialize();
    }

    setupEventListeners() {
      if (this.sendButton) {
        this.sendButton.addEventListener("click", this.sendMessage);
      }
      if (this.userInput) {
        this.userInput.addEventListener("keydown", this.handleKeyPress);
      }
    }

    cleanup() {
      if (this.sendButton) {
        this.sendButton.removeEventListener("click", this.sendMessage);
      }
      if (this.userInput) {
        this.userInput.removeEventListener("keydown", this.handleKeyPress);
      }
      document.removeEventListener("resetAIChat", this.resetChat);

      this.conversationHistory = [];
      this.problemData = null;
      this.userCode = null;
      this.studentId = null;
      this.messagesContainer = null;
      this.userInput = null;
      this.sendButton = null;
      this.isMarkedReady = false;
      this.markedErrorShown = false;
    }

    async resetChat() {
      console.log("Resetting chat...");
      this.conversationHistory = [];
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = "";
      }
      this.problemData = null;
      this.userCode = null;

      await this.fetchProblemData();

      if (this.problemData) {
        await this.addMessage(
          `I'm ready to help you with "${this.problemData.data.title}". What questions do you have?`,
          "ai"
        );
      }
    }

    handleKeyPress(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    }

    async initialize() {
      try {
        await this.waitForMarked();
        await this.fetchUserProfile();
        await this.fetchProblemData();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    }

    async waitForMarked(maxAttempts = 20) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = 500;

        const checkMarked = async () => {
          attempts++;
          console.log(
            `Checking for marked.js (attempt ${attempts}/${maxAttempts})`
          );

          const markedScript = document.querySelector(
            'script[src*="marked.min.js"]'
          );
          if (!markedScript) {
            console.log("marked.min.js script tag not found, reinserting...");
            const newMarkedScript = document.createElement("script");
            newMarkedScript.src = chrome.runtime.getURL("marked.min.js");
            document.head.appendChild(newMarkedScript);
          }

          if (window.marked) {
            try {
              if (typeof window.marked.parse === "function") {
                this.isMarkedReady = true;
                marked.setOptions({
                  breaks: true,
                  gfm: true,
                  headerIds: false,
                  mangle: false,
                  pedantic: false,
                  silent: true,
                });
                console.log("✓ Marked.js initialized successfully");
                resolve();
                return;
              }
            } catch (error) {
              console.error("Error configuring marked:", error);
            }
          }

          if (attempts >= maxAttempts) {
            console.warn(
              `Marked.js failed to initialize after ${maxAttempts} attempts`
            );
            await this.handleMarkedFailure();
            reject(new Error("Marked.js not available"));
            return;
          }

          setTimeout(checkMarked, interval);
        };

        checkMarked().catch((error) => {
          console.error("Error in checkMarked:", error);
          reject(error);
        });
      });
    }

    async handleMarkedFailure() {
      if (!this.markedErrorShown) {
        this.markedErrorShown = true;

        await this.addMessage(
          "⚠️ Enhanced formatting is temporarily unavailable. Messages will still be displayed in plain text. You can reload the page to try restoring full formatting.",
          "ai"
        );

        this.addFormattedMessage = async (content) => {
          const messageDiv = document.createElement("div");
          messageDiv.className = "message ai-message";

          const formattedContent = content.replace(
            /```([\s\S]*?)```/g,
            (match, code) => {
              return `<div class="code-block-wrapper fallback">
                        <pre><code>${code}</code></pre>
                      </div>`;
            }
          );

          messageDiv.innerHTML = formattedContent;
          this.messagesContainer.appendChild(messageDiv);
          this.scrollToBottom();
        };
      }
    }

    async fetchUserProfile() {
      try {
        const accessToken = document.cookie
          .split(";")
          .find((cookie) => cookie.trim().startsWith("access_token="))
          ?.split("=")[1];

        if (!accessToken) {
          console.error("No access token found");
          return;
        }

        const response = await fetch(
          "https://api2.maang.in/users/profile/private",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const profileData = await response.json();
        this.studentId = profileData.data.id;
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }

    async fetchProblemData() {
      const match = window.location.pathname.match(/\/problems\/.*?-(\d+)/);
      if (match) {
        const problemId = match[1];
        try {
          const accessToken = document.cookie
            .split(";")
            .find((cookie) => cookie.trim().startsWith("access_token="))
            ?.split("=")[1];

          if (!accessToken) {
            console.error("No access token found");
            return;
          }

          const response = await fetch(
            `https://api2.maang.in/problems/user/${problemId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          this.problemData = await response.json();
        } catch (error) {
          console.error("Error fetching problem data:", error);
        }
      }
    }

    getCurrentCode() {
      if (!this.studentId) {
        console.error("Student ID not available");
        return;
      }

      const languageDiv = document.querySelector(
        ".d-flex.align-items-center.gap-1.text-blue-dark"
      );
      const language = languageDiv?.textContent?.trim();

      if (!language) {
        console.error("Language not detected");
        return;
      }
      console.log("Lang", language);

      const match = window.location.pathname.match(/\/problems\/.*?-(\d+)/);
      const questionId = match ? match[1] : null;

      if (!questionId) {
        console.error("Question ID not found in URL");
        return;
      }

      const key = `course_${this.studentId}_${questionId}_${language}`;
      this.userCode = localStorage.getItem(key);
    }

    async addMessage(content, type) {
      if (!this.messagesContainer) {
        this.messagesContainer = document.getElementById("chat-messages");
      }

      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${type}-message`;

      if (type === "ai") {
        try {
          if (!this.isMarkedReady || !window.marked) {
            console.warn("Marked not ready, displaying plain text");
            messageDiv.textContent = content;
          } else {
            marked.setOptions({
              breaks: true,
              gfm: true,
            });

            let htmlContent = marked.parse(content);
            messageDiv.innerHTML = htmlContent;

            messageDiv.querySelectorAll("pre code").forEach((block) => {
              const wrapper = document.createElement("div");
              wrapper.className = "code-block-wrapper";
              block.parentNode.parentNode.insertBefore(
                wrapper,
                block.parentNode
              );
              wrapper.appendChild(block.parentNode);

              const copyButton = document.createElement("button");
              copyButton.className = "copy-button";
              copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              `;
              wrapper.appendChild(copyButton);

              copyButton.addEventListener("click", async () => {
                try {
                  await navigator.clipboard.writeText(block.textContent);
                  copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Copied!
                  `;
                  setTimeout(() => {
                    copyButton.innerHTML = `
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    `;
                  }, 2000);
                } catch (err) {
                  console.error("Failed to copy:", err);
                }
              });
            });
          }
        } catch (error) {
          console.error("Error processing message:", error);
          messageDiv.textContent = content;
        }
      } else {
        messageDiv.textContent = content;
      }

      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
    }

    scrollToBottom() {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
      const mainco = document.querySelector(
        ".coding_leftside_scroll__CMpky.pb-5"
      );
      if (mainco) {
        mainco.scrollTop = mainco.scrollHeight;
      }
    }

    async sendMessage() {
      const message = this.userInput.value.trim();

      if (!message) return;

      this.addMessage(message, "user");
      this.userInput.value = "";

      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      const thinkingDiv = document.createElement("div");
      thinkingDiv.className = "thinking-bubble";
      thinkingDiv.innerHTML = `
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      `;
      this.messagesContainer.appendChild(thinkingDiv);
      this.scrollToBottom();

      try {
        const response = await this.getAIResponse(message);
        thinkingDiv.remove();
        await this.addMessage(response, "ai");

        this.conversationHistory.push({
          role: "assistant",
          content: response,
        });
      } catch (error) {
        console.error("Error:", error);
        thinkingDiv.remove();
        if (
          error.message === "Please set your API key in the extension popup"
        ) {
          this.addMessage(
            "Please set your API key in the extension popup first.",
            "ai"
          );
        } else {
          this.addMessage(
            "Sorry, I encountered an error. Please try again.",
            "ai"
          );
        }
      }
    }

    async getAIResponse(message) {
      this.getCurrentCode();

      let API_KEY = await new Promise((resolve) => {
        const handleApiKeyMessage = (event) => {
          if (event.source !== window) return;
          if (event.data.type === "API_KEY_RESULT") {
            window.removeEventListener("message", handleApiKeyMessage);
            resolve(event.data.apiKey);
          }
        };
        window.addEventListener("message", handleApiKeyMessage);

        window.postMessage({ type: "GET_API_KEY" }, "*");
      });
      console.log(API_KEY);

      if (!API_KEY) {
        throw new Error("Please set your API key in the extension popup");
      }

      const API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

      const contextMessage = {
        role: "system",
        content: this.problemData
          ? `You are a highly skilled coding assistant designed to help users solve coding problems effectively on a platform like LeetCode known as AlgoZenith. Here's the context for the current problem:

Problem Title: ${this.problemData.data.title}

Description:
${this.problemData.data.body}

Input Format:
${this.problemData.data.input_format}

Output Format:
${this.problemData.data.output_format}

Constraints:
${this.problemData.data.constraints}

Hints or Solution Approach:
${this.problemData.data.hints?.solution_approach || "Not provided"}

Example Solution:
${this.problemData.data.editorial_code?.[0]?.code || "Not provided"}

The user has written the following code so far:
${this.userCode || "No code written yet"}

Your task:
1. Understand the user's query and respond with clear, concise explanations or solutions.
2. Help the user debug their code, pointing out errors or inefficiencies.
3. Suggest optimizations or alternative approaches.
4. Provide additional hints or step-by-step guidance if the user is stuck.
5. Always aim for a helpful and user-friendly response.

Ensure your responses are technically accurate, well-explained, and formatted clearly with appropriate code blocks where necessary.`
          : "You are a highly skilled coding assistant. Currently, no specific problem data is available. Assist the user with general coding queries, debugging, or conceptual explanations as effectively as possible.",
      };

      const formattedHistory = [contextMessage, ...this.conversationHistory]
        .map((msg) => {
          if (msg.role === "system") {
            return `Context: ${msg.content}\n`;
          }
          return `${msg.role === "user" ? "User" : "Assistant"}: ${
            msg.content
          }\n`;
        })
        .join("\n");

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: formattedHistory + "\nAssistant:",
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  };
}

document.addEventListener("initAIChat", () => {
  console.log("Initializing AIChat from webpage context");
  if (window.aiChatInstance) {
    window.aiChatInstance.cleanup();
  }
  window.aiChatInstance = new window.AIChat();
  document.dispatchEvent(new CustomEvent("aiChatCreated"));
});
