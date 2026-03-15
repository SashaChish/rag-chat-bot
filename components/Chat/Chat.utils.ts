/**
 * Chat Component Utilities
 * Helper functions specific to the Chat component
 */

import type { ChatUIMessage } from './Chat.types';
import type { ChatMessage } from '@/lib/types/core.types';

/**
 * Generate a unique session key for chat
 */
export function generateSessionKey(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Convert ChatUIMessage to ChatMessage for API
 */
export function toChatMessage(message: ChatUIMessage): ChatMessage {
  return {
    role: message.role,
    content: message.content,
  };
}

/**
 * Create a new user message
 */
export function createUserMessage(content: string): ChatUIMessage {
  return {
    id: Date.now(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a new assistant message with loading state
 */
export function createAssistantMessage(id?: number): ChatUIMessage {
  return {
    id: id || Date.now() + 1,
    role: 'assistant',
    content: '',
    sources: [],
    timestamp: new Date().toISOString(),
    isStreaming: true,
    loadingPhase: 'thinking',
  };
}

/**
 * Update assistant message with new content
 */
export function updateAssistantMessage(
  messages: ChatUIMessage[],
  id: number,
  updates: Partial<ChatUIMessage>,
): ChatUIMessage[] {
  return messages.map((msg) =>
    msg.id === id ? { ...msg, ...updates } : msg,
  );
}

/**
 * Get engine description based on type
 */
export function getEngineDescription(
  agentType: 'react' | 'openai' | null,
  chatEngineType: 'condense' | 'context',
): string {
  if (agentType === 'react') {
    return 'ReAct Agent uses reasoning + action patterns to autonomously search documents and answer complex, multi-step questions.';
  }
  if (agentType === 'openai') {
    return 'OpenAI Agent uses function calling to intelligently select and use tools for document search and answering.';
  }
  if (chatEngineType === 'condense') {
    return 'Condenses conversation history into a standalone query before retrieving relevant documents. Maintains context while keeping queries focused.';
  }
  return 'Retrieves relevant documents and provides them as context to LLM along with your conversation history. Explicit context for comprehensive answers.';
}
