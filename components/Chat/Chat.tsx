"use client";

import { useState, useRef, useEffect } from "react";
import MessageList from '../MessageList/MessageList';
import Modal from '../Modal/Modal';
import styles from './Chat.module.css';
import type {
  ChatProps,
} from '../../lib/types/components';
import type { ChatUIMessage, LoadingPhase } from './Chat.types';
import type { SourceInfo } from '../../lib/types/core.types';

export default function Chat({
  onSendMessage,
  supportedFormats,
}: ChatProps): JSX.Element {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const [chatEngineType, setChatEngineType] = useState<"condense" | "context">(
    "condense",
  );
  const [agentType, setAgentType] = useState<"react" | "openai" | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [sessionKey] = useState<string>(
    `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    if (trimmedInput.length < 5) {
      setInputError("Please enter at least 5 characters");
      return;
    }

    const userMessage: ChatUIMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantMessageId: number;

    try {
      assistantMessageId = Date.now() + 1;
      const assistantMessage: ChatUIMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
        timestamp: new Date().toISOString(),
        isStreaming: true,
        loadingPhase: "thinking",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const history = messages.map((msg) => ({
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
          agentType: agentType,
          sessionKey: sessionKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: SourceInfo[] = [];

      if (reader) {
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

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: fullContent,
                            isStreaming: false,
                            loadingPhase: "loadingSources",
                          }
                        : msg,
                    ),
                  );
                } else if (data.chunk) {
                  fullContent += data.chunk;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: fullContent,
                            isStreaming: true,
                            loadingPhase: "thinking",
                          }
                        : msg,
                    ),
                  );
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }

        // Send done signal with collected sources
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: fullContent,
                  sources,
                  isStreaming: false,
                  loadingPhase: null,
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Sorry, there was an error processing your request. Please try again.",
                error: true,
                isStreaming: false,
                loadingPhase: null,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = (): void => {
    if (messages.length === 0) return;
    setShowClearModal(true);
  };

  const handleConfirmClear = (): void => {
    setMessages([]);
    setChatEngineType("condense");
    setAgentType(null);
    setShowClearModal(false);
  };

  const handleCancelClear = (): void => {
    setShowClearModal(false);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.headerRow}>
          <h2>Chat with Your Documents</h2>
          <div className={styles.headerControls}>
            <select
              value={agentType || chatEngineType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const { value } = e.target;
                if (value === "react" || value === "openai") {
                  setAgentType(value as "react" | "openai");
                } else {
                  setAgentType(null);
                  if (value === "condense" || value === "context") {
                    setChatEngineType(value);
                  }
                }
              }}
              className={styles.engineSelector}
              disabled={isLoading}
            >
              <option value="condense">Condense Question</option>
              <option value="context">Context Engine</option>
              <option value="react">ReAct Agent</option>
              <option value="openai">OpenAI Agent</option>
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
        <p className={styles.engineDescription}>
          {agentType === "react"
            ? "ReAct Agent uses reasoning + action patterns to autonomously search documents and answer complex, multi-step questions."
            : agentType === "openai"
              ? "OpenAI Agent uses function calling to intelligently select and use tools for document search and answering."
              : chatEngineType === "condense"
                ? "Condenses conversation history into a standalone query before retrieving relevant documents. Maintains context while keeping queries focused."
                : "Retrieves relevant documents and provides them as context to LLM along with your conversation history. Explicit context for comprehensive answers."}
        </p>
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
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>

      {inputError && <div className={styles.inputError}>{inputError}</div>}

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
