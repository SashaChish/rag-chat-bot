import { CondenseQuestionChatEngine, ContextChatEngine } from "llamaindex";
import type {
  ChatMessage,
  ChatEngineType,
  IndexType,
  ChatEngineReturnType,
} from "../types/core.types";

const topK = parseInt(process.env.TOP_K_RESULTS || "3", 10);

export function convertToChatMessages(history: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((message) => {
    const role =
      typeof message.role === "string" ? message.role.toLowerCase() : "user";
    const content = typeof message.content === "string" ? message.content : "";

    let messageRole: "user" | "assistant" | "system";
    if (role === "user" || role === "human") {
      messageRole = "user";
    } else if (role === "assistant" || role === "ai") {
      messageRole = "assistant";
    } else if (role === "system") {
      messageRole = "system";
    } else {
      messageRole = "user";
    }

    return {
      role: messageRole,
      content: content,
    };
  });
}

export function createCondenseChatEngine(
  index: IndexType,
  chatHistory: ChatMessage[] = [],
  systemPrompt: string | null = null,
): ChatEngineReturnType {
  const queryEngine = index.asQueryEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
  });

  // Create system message with proper typing
  const systemMessage = systemPrompt
    ? ({ role: "system", content: systemPrompt } as const)
    : null;

  const historyWithSystem = systemMessage
    ? [systemMessage, ...chatHistory]
    : chatHistory;

  const result = new CondenseQuestionChatEngine({
    queryEngine,
    chatHistory: historyWithSystem,
  });
  return result;
}

export function createContextChatEngine(
  index: IndexType,
  chatHistory: ChatMessage[] = [],
  systemPrompt: string | null = null,
): ChatEngineReturnType {
  const systemMessage = systemPrompt
    ? ({ role: "system", content: systemPrompt } as const)
    : null;

  const historyWithSystem = systemMessage
    ? [systemMessage, ...chatHistory]
    : chatHistory;

  const result = new ContextChatEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
    chatHistory: historyWithSystem,
  });
  return result;
}

const chatEngineCache = new Map<string, ChatEngineReturnType>();

export async function getChatEngine(
  index: IndexType,
  type: ChatEngineType = "condense",
  chatHistory: ChatMessage[] = [],
  sessionKey: string = "default",
  systemPrompt?: string | null,
): Promise<ChatEngineReturnType> {
  const cacheKey = `${sessionKey}-${type}`;

  if (type === "condense" && chatHistory.length > 0) {
    return createCondenseChatEngine(index, chatHistory, systemPrompt);
  }

  if (chatEngineCache.has(cacheKey)) {
    return chatEngineCache.get(cacheKey)!;
  }

  let engine: ChatEngineReturnType;
  switch (type) {
    case "context":
      engine = createContextChatEngine(index, chatHistory, systemPrompt);
      break;
    case "condense":
    default:
      engine = createCondenseChatEngine(index, chatHistory, systemPrompt);
      break;
  }

  // Only cache if no history (to avoid stale context)
  if (chatHistory.length === 0) {
    chatEngineCache.set(cacheKey, engine);
  }

  return engine;
}

export function clearChatEngineCache(sessionKey: string = "default"): void {
  for (const [key] of chatEngineCache) {
    if (key.startsWith(sessionKey)) {
      chatEngineCache.delete(key);
    }
  }
}
