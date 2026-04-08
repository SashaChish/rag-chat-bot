"use client";

import { useState, useRef, useEffect } from "react";
import MessageList from '../MessageList/MessageList';
import { ConfirmModal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils/cn';
import { IconButton } from '../ui/IconButton';
import { SidebarOpenIcon } from '@/lib/icons';
import type { SourceInfo } from '../../lib/types/core.types';
import type { ChatUIMessage, ChatProps } from './Chat.types';

export default function Chat({ onToggleSidebar, sidebarToggleVisible }: ChatProps): JSX.Element {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const [chatEngineType, setChatEngineType] = useState<"condense" | "context">(
    "condense",
  );
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
                } else if (data.response) {
                  fullContent = data.response;
                  sources = data.sources || [];

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
    setShowClearModal(false);
  };

  const handleCancelClear = (): void => {
    setShowClearModal(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex-none flex flex-col p-4 border-b border-zinc-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {sidebarToggleVisible && (
              <IconButton
                icon={<SidebarOpenIcon />}
                aria-label="Open documents panel"
                onClick={onToggleSidebar}
                color="default"
                size="small"
              />
            )}
            <h2 className="m-0 text-xl font-semibold text-zinc-900">Chat with Your Documents</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chatEngineType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const { value } = e.target;
                if (value === "condense" || value === "context") {
                  setChatEngineType(value);
                }
              }}
              className="py-2 px-2 bg-white border border-zinc-300 rounded-md text-sm text-zinc-600 cursor-pointer transition-colors hover:border-primary-500 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/10 disabled:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
              data-testid="engine-selector"
            >
              <option value="condense">Condense Question</option>
              <option value="context">Context Engine</option>
            </select>
            {messages.length > 0 && (
              <Button
                onClick={handleClearChat}
                variant="text"
                color="default"
                size="small"
                data-testid="clear-chat-button"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
        <p className="mt-1 mb-0 text-sm text-zinc-500 leading-relaxed">
          {chatEngineType === "condense"
            ? "Condenses conversation history into a standalone query before retrieving relevant documents. Maintains context while keeping queries focused."
            : "Retrieves relevant documents and provides them as context to LLM along with your conversation history. Explicit context for comprehensive answers."}
        </p>
      </div>

      <MessageList messages={messages} scrollAnchorRef={messagesEndRef} />

      <div className="flex-none flex gap-2 p-4 border-t border-zinc-200 bg-white">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setInputError("");
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your documents..."
          className={cn(
            "flex-1 py-3 px-3 border border-zinc-300 rounded-lg resize-none font-inherit text-base",
            "focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/10",
            "disabled:bg-zinc-50 disabled:cursor-not-allowed"
          )}
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          size="large"
          disabled={isLoading || !input.trim()}
          loading={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {inputError && (
        <div
          className="py-3 px-4 mx-4 bg-danger-100 text-danger-800 rounded-lg text-sm border-l-[3px] border-danger-600 animate-[slideDown_0.2s_ease-out]"
          data-testid="input-error"
        >
          {inputError}
        </div>
      )}

      <ConfirmModal
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
