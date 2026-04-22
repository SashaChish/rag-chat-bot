"use client";

import { useState, useRef, useEffect } from "react";
import { Paper, Group, Text, Textarea, Select, Divider, Box, Alert } from '@mantine/core';
import MessageList from '../MessageList/MessageList';
import { ConfirmModal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { SidebarOpenIcon } from '@/lib/icons';
import type { SourceInfo } from '../../lib/types/core.types';
import type { ChatUIMessage, ChatProps } from './Chat.types';

export default function Chat({ onToggleSidebar, sidebarToggleVisible }: ChatProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent): void => {
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
    <Paper
      shadow="xs"
      radius="md"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      <Box style={{ flexShrink: 0 }}>
        <Group justify="space-between" p="md" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            {sidebarToggleVisible && (
              <IconButton
                icon={<SidebarOpenIcon />}
                aria-label="Open documents panel"
                onClick={onToggleSidebar}
                color="default"
                size="small"
              />
            )}
            <Text fw={600} size="xl">Chat with Your Documents</Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Select
              size="sm"
              value={chatEngineType}
              onChange={(value) => {
                if (value === "condense" || value === "context") {
                  setChatEngineType(value);
                }
              }}
              data={[
                { value: 'condense', label: 'Condense Question' },
                { value: 'context', label: 'Context Engine' },
              ]}
              disabled={isLoading}
              data-testid="engine-selector"
              allowDeselect={false}
            />
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
          </Group>
        </Group>
        <Text c="dimmed" size="sm" px="md" pb="sm" style={{ lineHeight: 1.6 }}>
          {chatEngineType === "condense"
            ? "Condenses conversation history into a standalone query before retrieving relevant documents. Maintains context while keeping queries focused."
            : "Retrieves relevant documents and provides them as context to LLM along with your conversation history. Explicit context for comprehensive answers."}
        </Text>
        <Divider />
      </Box>

      <MessageList messages={messages} scrollAnchorRef={messagesEndRef} />

      <Box style={{ flexShrink: 0 }}>
        <Divider />
        <Group p="md" gap="sm" wrap="nowrap">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.currentTarget.value);
              setInputError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            autosize
            minRows={1}
            maxRows={4}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleSendMessage}
            size="large"
            disabled={isLoading || !input.trim()}
            loading={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Group>
      </Box>

      {inputError && (
        <Alert
          color="red"
          mx="md"
          mb="md"
          data-testid="input-error"
          style={{ borderLeft: '3px solid var(--mantine-color-red-6)' }}
        >
          {inputError}
        </Alert>
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
    </Paper>
  );
}
