import {
  CondenseQuestionChatEngine,
  ContextChatEngine,
} from "llamaindex";
import { Settings } from "@llamaindex/core/global";
import type { ChatMessage, ChatEngineType, IndexType, ChatEngineReturnType } from "../types";

const topK = parseInt(process.env.TOP_K_RESULTS || "3", 10);

export function convertToChatMessages(history: unknown[]): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((msg) => {
    if (!msg || typeof msg !== 'object') {
      return {
        role: 'user',
        content: '',
      };
    }

    const message = msg as Record<string, unknown>;
    const role = typeof message.role === 'string' ? message.role.toLowerCase() : 'user';
    const content = typeof message.content === 'string' ? message.content : '';

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
  systemPrompt: string | null = null
): ChatEngineReturnType {
  const queryEngine = index.asQueryEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
  });

  // Prepend system message if provided
  const historyWithSystem = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...chatHistory]
    : chatHistory;

  // @ts-ignore - LlamaIndex.TS ChatMessage type compatibility
  const result = new CondenseQuestionChatEngine({
    queryEngine,
    chatHistory: historyWithSystem as any,
  });
  return result as unknown as ChatEngineReturnType;
}

export function createContextChatEngine(
  index: IndexType,
  chatHistory: ChatMessage[] = [],
  systemPrompt: string | null = null
): ChatEngineReturnType {
  const historyWithSystem = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...chatHistory]
    : chatHistory;

  const result = new ContextChatEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
    chatHistory: historyWithSystem as any,
  });
  return result as unknown as ChatEngineReturnType;
}

const chatEngineCache = new Map<string, ChatEngineReturnType>();

export async function getChatEngine(
  index: IndexType,
  type: ChatEngineType = "condense",
  chatHistory: ChatMessage[] = [],
  sessionKey: string = "default",
  systemPrompt?: string | null
): Promise<ChatEngineReturnType> {
  const cacheKey = `${sessionKey}-${type}`;

  // For condense engine with history, we create fresh each time
  // For context engine, we create fresh each time to ensure correct context
  if (type === "condense" && chatHistory.length > 0) {
    return createCondenseChatEngine(index, chatHistory, systemPrompt);
  }

  if (chatEngineCache.has(cacheKey)) {
    return chatEngineCache.get(cacheKey);
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