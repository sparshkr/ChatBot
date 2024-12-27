class AIChat {
  constructor() {
    // DOM elements
    this.messagesContainer = document.getElementById("chat-messages");
    this.userInput = document.getElementById("user-input");
    this.sendButton = document.getElementById("send-message");

    // State variables
    this.conversationHistory = [];
    this.problemData = null;
    this.userCode = null;
    this.studentId = null;
    this.isInitialized = false;

    // Bind methods to preserve 'this' context
    this.sendMessage = this.sendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.cleanup = this.cleanup.bind(this);

    // Initialize
    this.setupEventListeners();
    this.initialize();
  }

  setupEventListeners() {
    if (!this.sendButton || !this.userInput) {
      console.error("Required DOM elements not found");
      return;
    }

    console.log("Setting up event listeners");
    this.sendButton.addEventListener("click", this.sendMessage);
    this.userInput.addEventListener("keydown", this.handleKeyPress);
  }

  cleanup() {
    console.log("Cleaning up AIChat instance");

    // Remove event listeners
    if (this.sendButton) {
      this.sendButton.removeEventListener("click", this.sendMessage);
    }
    if (this.userInput) {
      this.userInput.removeEventListener("keydown", this.handleKeyPress);
    }

    // Clear state
    this.conversationHistory = [];
    this.problemData = null;
    this.userCode = null;
    this.studentId = null;
    this.isInitialized = false;

    // Clear DOM references
    this.messagesContainer = null;
    this.userInput = null;
    this.sendButton = null;
  }

  handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async initialize() {
    try {
      await this.fetchUserProfile();
      if (this.studentId) {
        await Promise.all([this.fetchProblemData(), this.getCurrentCode()]);
      }
      this.isInitialized = true;
      console.log("AIChat initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AIChat:", error);
    }
  }

  async fetchUserProfile() {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        "https://api2.maang.in/users/profile/private",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const profileData = await response.json();
      this.studentId = profileData.data.id;
      console.log("Got student ID:", this.studentId);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  async fetchProblemData() {
    const match = window.location.pathname.match(/\/problems\/.*?-(\d+)/);
    if (!match) return;

    try {
      const problemId = match[1];
      const accessToken = this.getAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        `https://api2.maang.in/problems/user/${problemId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.problemData = await response.json();
      console.log("Problem data fetched successfully");
    } catch (error) {
      console.error("Error fetching problem data:", error);
      throw error;
    }
  }

  async getCurrentCode() {
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

    const match = window.location.pathname.match(/\/problems\/.*?-(\d+)/);
    const questionId = match ? match[1] : null;

    if (!questionId) {
      console.error("Question ID not found in URL");
      return;
    }

    const key = `course_${this.studentId}_${questionId}_${language}`;
    this.userCode = localStorage.getItem(key);

    // Set up a storage event listener to update code when it changes
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        this.userCode = e.newValue;
        console.log("Code updated:", this.userCode);
      }
    });
  }

  getAccessToken() {
    const accessToken = document.cookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith("access_token="))
      ?.split("=")[1];

    if (!accessToken) {
      console.error("No access token found");
      return null;
    }

    return accessToken;
  }

  async sendMessage() {
    if (!this.isInitialized) {
      console.error("AIChat not fully initialized");
      return;
    }

    const message = this.userInput?.value?.trim();
    if (!message) return;

    console.log("Sending message:", message);
    this.addMessage(message, "user");
    this.userInput.value = "";

    this.conversationHistory.push({
      role: "user",
      content: message,
    });

    const thinkingDiv = this.showThinkingIndicator();

    try {
      const response = await this.getAIResponse(message);
      thinkingDiv.remove();
      this.addMessage(response, "ai");

      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      thinkingDiv.remove();
      this.addMessage("Sorry, I encountered an error. Please try again.", "ai");
    }
  }

  showThinkingIndicator() {
    const thinkingDiv = document.createElement("div");
    thinkingDiv.className = "thinking-bubble";
    thinkingDiv.innerHTML = `
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    `;
    this.messagesContainer?.appendChild(thinkingDiv);
    this.scrollToBottom();
    return thinkingDiv;
  }

  addMessage(content, type) {
    if (!this.messagesContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = content;
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

  formatProblemContext() {
    if (!this.problemData?.data) return "No problem data available";

    return `Problem: ${this.problemData.data.title}
Description: ${this.problemData.data.body}
Input Format: ${this.problemData.data.input_format}
Output Format: ${this.problemData.data.output_format}
Constraints: ${this.problemData.data.constraints}
Solution Approach: ${this.problemData.data.hints?.solution_approach || ""}
Example Solution: ${this.problemData.data.editorial_code?.[0]?.code || ""}

Your Current Code:
${this.userCode || "No code written yet"}`;
  }

  async getAIResponse(message) {
    const API_KEY = "YOUR_API_KEY"; // Replace with actual API key
    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    const contextMessage = {
      role: "system",
      content: this.formatProblemContext(),
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
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

// Listen for initialization event
document.addEventListener("initAIChat", () => {
  console.log("Initializing AIChat from webpage context");
  window.aiChatInstance = new AIChat();
  // Notify the extension that AIChat was created
  document.dispatchEvent(new CustomEvent("aiChatCreated"));
});
