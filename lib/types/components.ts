/**
 * React Component Types
 * Type definitions for React components in RAG chatbot
 */

import type { ReactNode } from 'react';
import type { SourceInfo, ChatMessage, DocumentListEntry } from './core.types';
import type { DocumentUploadResponse } from './api';

/**
 * Chat component props
 */
export interface ChatProps {
  onSendMessage?: (message: string) => void;
  supportedFormats?: string[];
}

/**
 * Message list component props
 */
export interface MessageListProps {
  messages: ChatUIMessage[];
  scrollAnchorRef?: React.RefObject<HTMLDivElement>;
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
  loadingPhase?: 'thinking' | 'loadingSources' | null;
}

/**
 * Chat UI loading phase
 */
export type LoadingPhase = 'thinking' | 'loadingSources' | null;

/**
 * Component size
 */
export type ComponentSize = 'small' | 'medium' | 'large';

/**
 * Button variant style
 */
export type ButtonVariant = 'filled' | 'outlined' | 'text';

/**
 * Button color theme
 */
export type ButtonColor = 'primary' | 'danger' | 'success' | 'default';

/**
 * Button component props
 */
export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ComponentSize;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
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

/**
 * Upload component props
 */
export interface UploadProps {
  onUpload?: (file: File) => Promise<void>;
  onUploadSuccess?: (data: DocumentUploadResponse) => void;
  maxSize?: number;
  allowedTypes?: string[];
  supportedFormats?: string[];
}

/**
 * Document list component props
 */
export interface DocumentListProps {
  documents: DocumentListEntry[];
  loading?: boolean;
  onDocumentDelete?: (id: string) => Promise<void>;
  onDocumentDownload?: (document: DocumentListEntry) => void;
}

/**
 * Modal variant type
 */
export type ModalVariant = 'default' | 'danger' | 'warning' | 'success';

/**
 * Confirm modal props (for confirmation dialogs)
 */
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
  size?: 'small' | 'medium' | 'large';
}

/**
 * Modal component props (either confirm or content)
 */
export type ModalProps = ConfirmModalProps | ContentModalProps;
