import type { ReactNode } from "react";
import type { SourceInfo, ChatMessage } from "./core.types";

export interface MessageListProps {
  messages: ChatUIMessage[];
  scrollAnchorRef?: React.RefObject<HTMLDivElement | null>;
}

export interface ChatUIMessage extends ChatMessage {
  id: number | string;
  timestamp: string;
  sources?: SourceInfo[];
  isStreaming?: boolean;
  error?: boolean;
  loadingPhase?: "thinking" | "loadingSources" | null;
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

export interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "small" | "medium" | "large";
}
