import type { ReactNode } from "react";
import type { SourceInfo, ChatMessage, DocumentListEntry } from "./core.types";

/**
 * Message list component props
 */
export interface MessageListProps {
  messages: ChatUIMessage[];
  scrollAnchorRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Chat UI message
 */
export interface ChatUIMessage extends ChatMessage {
  id: number | string;
  timestamp: string;
  sources?: SourceInfo[];
  isStreaming?: boolean;
  error?: boolean;
  loadingPhase?: "thinking" | "loadingSources" | null;
}

/**
 * Select component props
 */
export interface SelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Textarea component props
 */
export interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export interface DocumentListProps {
  documents: DocumentListEntry[];
  loading?: boolean;
  onDocumentDelete?: (id: string) => Promise<void>;
  onDocumentDownload?: (document: DocumentListEntry) => void;
}

export type ModalVariant = "default" | "danger" | "warning" | "success";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
}

/**
 * Content modal props (for flexible content)
 */
export interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "small" | "medium" | "large";
}
