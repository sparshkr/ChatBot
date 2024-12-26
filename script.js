class AIChat {
  constructor() {
    this.messagesContainer = document.getElementById("chat-messages");
    this.userInput = document.getElementById("user-input");
    this.sendButton = document.getElementById("send-message");

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage(message, "user");
    this.userInput.value = "";

    // Show thinking indicator
    const thinkingDiv = document.createElement("div");
    thinkingDiv.id = "thinking";
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
      this.addMessage(response, "ai");
    } catch (error) {
      thinkingDiv.remove();
      this.addMessage("Sorry, I encountered an error. Please try again.", "ai");
      console.error("Error:", error);
    }
  }

  addMessage(content, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;

    if (type === "ai") {
      try {
        messageDiv.innerHTML = marked.parse(content);
      } catch (e) {
        messageDiv.textContent = content;
      }
    } else {
      messageDiv.textContent = content;
    }

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    const mainco = document.querySelector(
      ".coding_leftside_scroll__CMpky.pb-5"
    );
    if (mainco) {
      mainco.scrollTop = mainco.scrollHeight;
    }
  }

  async getAIResponse(message) {
    const API_KEY = "YOUR_API_KEY"; // Replace with your actual API key
    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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
                text: message,
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
}

// Initialize the chat when the script loads
const aiChat = new AIChat();
