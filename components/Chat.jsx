/**
 * Chat Interface Component
 * Main chat interface with message history and input
 */

"use client";

import { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import Modal from "./Modal";
import styles from "./Chat.module.css";

export default function Chat({ onSendMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const [chatEngineType, setChatEngineType] = useState("condense");
  const [showClearModal, setShowClearModal] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    if (trimmedInput.length < 5) {
      setInputError("Please enter at least 5 characters");
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLoadingPhase("thinking");

    try {
      const assistantMessageId = Date.now() + 1;
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
        timestamp: new Date().toISOString(),
        isStreaming: true,
        loadingPhase: "thinking",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Convert messages to conversation history format
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedInput,
          streaming: true,
          conversationHistory: history,
          chatEngineType: chatEngineType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.done) {
                sources = data.sources || [];
                setLoadingPhase("loadingSources");
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent, isStreaming: false, loadingPhase: "loadingSources" }
                      : msg
                  )
                );
              } else if (data.chunk) {
                fullContent += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent, isStreaming: true, loadingPhase: "thinking" }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullContent, sources, isStreaming: false, loadingPhase: null }
            : msg
        )
      );
      setLoadingPhase(null);
    } catch (error) {
      console.error("Error sending message:", error);
      // Update the assistant message to show error instead of adding a new message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, there was an error processing your request. Please try again.",
                error: true,
                isStreaming: false,
                loadingPhase: null,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
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
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setMessages([]);
    setChatEngineType("condense");
    setShowClearModal(false);
  };

  const handleCancelClear = () => {
    setShowClearModal(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Chat with Your Documents</h2>
        <div className={styles.headerControls}>
          <select
            value={chatEngineType}
            onChange={(e) => setChatEngineType(e.target.value)}
            className={styles.engineSelector}
            disabled={isLoading}
          >
            <option value="condense">Condense Question</option>
            <option value="context">Context Engine</option>
          </select>
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
      </div>

      <MessageList messages={messages} scrollAnchorRef={messagesEndRef} />

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

      <Modal
        isOpen={showClearModal}
        onClose={handleCancelClear}
        onConfirm={handleConfirmClear}
        title="Clear Chat History"
        message="Are you sure you want to clear all chat history? This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
