// script.js
class AIChat {
  constructor() {
    this.messagesContainer = document.getElementById("chat-messages");
    this.userInput = document.getElementById("user-input");
    this.sendButton = document.getElementById("send-message");
    this.conversationHistory = [];
    this.problemData = null;
    this.userCode = null;
    this.studentId = null;

    this.sendMessage = this.sendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.setupEventListeners();
    this.initialize();
  }

  setupEventListeners() {
    console.log("Setting up event listeners");
    this.sendButton.onclick = this.sendMessage;
    this.userInput.onkeydown = this.handleKeyPress;
  }

  handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async initialize() {
    await this.fetchUserProfile();
    await this.fetchProblemData();
    this.getCurrentCode();
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
      console.log("Got student ID:", this.studentId);
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
        console.log("Problem data:", this.problemData);
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

    // Get current language from the div
    const languageDiv = document.querySelector(
      ".d-flex.align-items-center.gap-1.text-blue-dark"
    );
    const language = languageDiv?.textContent?.trim();

    if (!language) {
      console.error("Language not detected");
      return;
    }

    // Get question number from URL
    const match = window.location.pathname.match(/\/problems\/.*?-(\d+)/);
    const questionId = match ? match[1] : null;

    if (!questionId) {
      console.error("Question ID not found in URL");
      return;
    }

    // Form localStorage key and get code
    const key = `course_${this.studentId}_${questionId}_${language}`;
    this.userCode = localStorage.getItem(key);
    console.log("Current user code:", this.userCode);
  }

  async sendMessage() {
    const message = this.userInput.value.trim();
    console.log("Sending message:", message);

    if (!message) return;

    this.addMessage(message, "user");
    this.userInput.value = "";

    // Add user message to conversation history
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
      console.log("Getting AI response...");
      const response = await this.getAIResponse(message);
      thinkingDiv.remove();
      this.addMessage(response, "ai");

      // Add AI response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });
    } catch (error) {
      console.error("Error:", error);
      thinkingDiv.remove();
      this.addMessage("Sorry, I encountered an error. Please try again.", "ai");
    }
  }

  addMessage(content, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = content;
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
    const API_KEY = "AIzaSyB0LRP3gTieo4xZxvQGEWgOO_FWXVO0wfM";
    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

    const contextMessage = {
      role: "system",
      content: this.problemData
        ? `Problem: ${this.problemData.data.title}
Description: ${this.problemData.data.body}
Input Format: ${this.problemData.data.input_format}
Output Format: ${this.problemData.data.output_format}
Constraints: ${this.problemData.data.constraints}
Solution Approach: ${this.problemData.data.hints?.solution_approach || ""}
Example Solution: ${this.problemData.data.editorial_code?.[0]?.code || ""}

Your Current Code:
${this.userCode || "No code written yet"}`
        : "No problem data available",
    };
    console.log(this.userCode);

    // Format conversation history into a single prompt
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
    console.log("Got AI response:", data);
    return data.candidates[0].content.parts[0].text;
  }
}

console.log("Initializing AIChat...");
const aiChat = new AIChat();
