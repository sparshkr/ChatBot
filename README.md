﻿# AI Teaching Assistant for Coding Platform

This Chrome extension transforms the coding learning experience by integrating an AI mentor directly into coding platforms. Instead of simply providing solutions, it acts as an experienced programming mentor, guiding students toward understanding through thoughtful questions and targeted hints.

## Demo

https://www.youtube.com/watch?v=YXRxrHFh2z0

The video demonstrates how our AI teaching assistant seamlessly integrates into the coding platform's interface. When students encounter challenges while solving problems, they can engage with the AI mentor through a clean, intuitive chat interface. The AI analyzes their code and progress, providing personalized guidance that helps develop stronger problem-solving skills rather than just giving away answers.

### Core Features

The extension delivers an enhanced learning experience through several thoughtfully designed features:

The AI mentor carefully examines your code and thought process, offering personalized guidance that helps you discover solutions independently. Rather than providing direct answers, it engages in meaningful dialogue that deepens your understanding of programming concepts and problem-solving strategies.

The system maintains awareness of the current problem, your code, and your previous interactions, ensuring that guidance remains relevant and builds upon your progress. This context-aware approach allows for more natural and effective learning conversations.

The chat interface creates a comfortable environment for interacting with your AI mentor, complete with syntax-highlighted code formatting and seamless integration with the platform's existing UI. The system maintains conversation context throughout your problem-solving session, allowing you to build understanding progressively.

### Technical Implementation

The extension leverages modern web technologies to create a robust educational tool:

The frontend is built with vanilla JavaScript and carefully crafted CSS, ensuring smooth integration with the existing platform. We use Marked.js for rendering formatted explanations, making technical discussions clear and readable.

At its core, the extension uses Chrome Extension APIs for browser integration and the Gemini Pro API for AI capabilities. We've implemented secure API key management and robust error handling to ensure a reliable experience.

The AI integration features custom-engineered teaching prompts and context-aware conversation management, optimized for educational effectiveness rather than just problem solving.

## Installation Guide

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Click the extension icon and enter your API key
