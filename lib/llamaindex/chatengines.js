import {
  CondenseQuestionChatEngine,
  ContextChatEngine,
} from "llamaindex";
import { Settings } from "@llamaindex/core/global";

const topK = parseInt(process.env.TOP_K_RESULTS || "3");

/**
 * Convert client conversation history format to LlamaIndex ChatMessage format
 * @param {Array} history - Array of messages with {role, content} structure
 * @returns {Array<Object>} Array of LlamaIndex ChatMessage-compatible objects
 */
export function convertToChatMessages(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((msg) => {
    const role = msg.role?.toLowerCase();
    const content = msg.content || "";

    let messageRole;
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

/**
 * Create a CondenseQuestionChatEngine
 * This engine condenses conversation history for efficient context-aware queries
 * @param {VectorStoreIndex} index - The document index
 * @param {Array} chatHistory - Conversation history in LlamaIndex ChatMessage format
 * @returns {CondenseQuestionChatEngine} Configured chat engine
 */
export function createCondenseChatEngine(index, chatHistory = []) {
  const queryEngine = index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: topK,
  });

  return new CondenseQuestionChatEngine({
    queryEngine,
    chatHistory,
  });
}

/**
 * Create a ContextChatEngine
 * This engine uses the retriever to provide custom context for each query
 * @param {VectorStoreIndex} index - The document index
 * @param {Array} chatHistory - Conversation history in LlamaIndex ChatMessage format
 * @returns {ContextChatEngine} Configured chat engine
 */
export function createContextChatEngine(index, chatHistory = []) {
  return new ContextChatEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
    chatHistory,
  });
}

/**
 * Cache for chat engines to avoid recreation overhead
 */
const chatEngineCache = new Map();

/**
 * Get or create a chat engine based on type
 * Caches engines by session key for performance
 * @param {VectorStoreIndex} index - The document index
 * @param {string} type - Chat engine type: "condense" or "context"
 * @param {Array} chatHistory - Conversation history in LlamaIndex ChatMessage format
 * @param {string} sessionKey - Optional session key for caching
 * @returns {Promise<ChatEngine>} Configured chat engine
 */
export async function getChatEngine(index, type = "condense", chatHistory = [], sessionKey = "default") {
  const cacheKey = `${sessionKey}-${type}`;
  
  // For condense engine with history, we can cache with the history
  // For context engine, we create fresh each time to ensure correct context
  if (type === "condense" && chatHistory.length > 0) {
    return createCondenseChatEngine(index, chatHistory);
  }

  // Check cache for context engine or empty history
  if (chatEngineCache.has(cacheKey)) {
    return chatEngineCache.get(cacheKey);
  }

  let engine;
  switch (type) {
    case "context":
      engine = createContextChatEngine(index, chatHistory);
      break;
    case "condense":
    default:
      engine = createCondenseChatEngine(index, chatHistory);
      break;
  }

  // Only cache if no history (to avoid stale context)
  if (chatHistory.length === 0) {
    chatEngineCache.set(cacheKey, engine);
  }

  return engine;
}

/**
 * Clear cached chat engines for a session
 * @param {string} sessionKey - Session key to clear
 */
export function clearChatEngineCache(sessionKey = "default") {
  for (const [key] of chatEngineCache) {
    if (key.startsWith(sessionKey)) {
      chatEngineCache.delete(key);
    }
  }
}
