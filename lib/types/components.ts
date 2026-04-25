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
