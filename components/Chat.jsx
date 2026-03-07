/**
 * Chat Interface Component
 * Main chat interface with message history and input
 */

"use client";

import { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import styles from "./Chat.module.css";

export default function Chat({ onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    // Validation
    if (trimmedInput.length < 5) {
      setInputError("Please enter at least 5 characters");
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create a placeholder assistant message for streaming
      const assistantMessageId = Date.now() + 1;
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Use streaming API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput, streaming: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.done) {
                // Stream complete
                sources = data.sources || [];
              } else if (data.chunk) {
                // Accumulate the streaming content
                fullContent += data.chunk;

                // Update the message content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              } else if (data.response) {
                // Non-streaming fallback
                fullContent = data.response;
                sources = data.sources || [];
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // Update the assistant message with final content and sources
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullContent, sources, isStreaming: false }
            : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        error: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (confirm("Clear all chat history?")) {
      setMessages([]);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Chat with Your Documents</h2>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className={styles.clearChatButton}
            type="button"
          >
            Clear Chat
          </button>
        )}
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <div className={styles.chatInputContainer}>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setInputError("");
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your documents..."
          className={styles.chatInput}
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          className={styles.sendButton}
          disabled={isLoading || !input.trim()}
          type="button"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>

      {inputError && (
        <div className={styles.inputError}>
          {inputError}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
