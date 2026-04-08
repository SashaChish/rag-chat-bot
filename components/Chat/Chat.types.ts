/**
 * Chat Component Types
 * Type definitions specific to the Chat component
 */

import type { SourceInfo } from '@/lib/types/core.types';

/**
 * Chat UI message extending base ChatMessage with UI-specific properties
 */
export interface ChatUIMessage {
  id: number | string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: SourceInfo[];
  isStreaming?: boolean;
  error?: boolean;
  loadingPhase?: 'thinking' | 'loadingSources' | null;
}

/**
 * Loading phase for chat message
 */
export type LoadingPhase = 'thinking' | 'loadingSources' | null;

/**
 * Chat component state interface
 */
export interface ChatState {
  messages: ChatUIMessage[];
  input: string;
  isLoading: boolean;
  inputError: string;
  chatEngineType: 'condense' | 'context';
  agentType: 'react' | 'openai' | null;
  showClearModal: boolean;
  sessionKey: string;
}

export interface ChatProps {
  onToggleSidebar?: () => void;
  sidebarToggleVisible?: boolean;
}
