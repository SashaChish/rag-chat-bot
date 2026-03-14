/**
 * Agent Factory Module
 * Provides factory functions for creating ReActAgent instances
 * with document search capabilities and tool support.
 *
 * Note: In LlamaIndex.TS, the primary agent is ReActAgent.
 * OpenAI-specific functionality is achieved by configuring Settings.llm
 * to use an OpenAI provider, not through a separate OpenAIAgent class.
 */

import {
  ReActAgent,
  QueryEngineTool,
  Tool,
} from "llamaindex";
import { Settings } from "@llamaindex/core/global";

const topK = parseInt(process.env.TOP_K_RESULTS || "3");

/**
 * Cache for agent instances to avoid recreation overhead
 * Key format: "agentType-sessionKey"
 */
const agentCache = new Map();

/**
 * Create a QueryEngineTool for document search
 * @param {VectorStoreIndex} index - The document index
 * @param {string} name - Tool name (default: "document_search")
 * @returns {QueryEngineTool} Configured query engine tool
 */
export function createDocumentSearchTool(index, name = "document_search") {
  const queryEngine = index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: topK,
  });

  return new QueryEngineTool({
    queryEngine: queryEngine,
    metadata: {
      name: name,
      description: "Search through uploaded documents to find relevant information",
    },
  });
}

/**
 * Create a summary tool for document summarization
 * @param {VectorStoreIndex} index - The document index
 * @returns {Tool} Configured summary tool
 */
export function createSummaryTool(index) {
  return new Tool({
    metadata: {
      name: "summarize_documents",
      description: "Generate a summary of information from uploaded documents",
    },
    fn: async (query) => {
      const queryEngine = index.asQueryEngine();
      const response = await queryEngine.query({
        query: `Provide a summary: ${query}`,
      });
      return response.toString();
    },
  });
}

/**
 * Create a ReActAgent with document search capability
 * ReAct (Reasoning + Acting) Agent uses a loop of thought, action, observation
 * @param {VectorStoreIndex} index - The document index
 * @param {Array<Tool>} tools - Additional tools to include
 * @param {Object} options - Agent configuration options
 * @param {string} options.systemPrompt - Optional system prompt for the agent
 * @returns {ReActAgent} Configured ReAct agent
 */
export function createReActAgent(index, tools = [], options = {}) {
  const defaultTools = [createDocumentSearchTool(index)];
  const agentTools = [...defaultTools, ...tools];

  // Prepare agent configuration
  const agentConfig = {
    tools: agentTools,
    llm: Settings.llm,
    verbose: options.verbose || process.env.VERBOSE === "true",
    maxIterations: options.maxIterations || parseInt(process.env.AGENT_MAX_ITERATIONS || "10"),
    contextWindow: options.contextWindow,
  };

  // Add system prompt if provided (LlamaIndex.TS ReActAgent supports systemPrompt)
  if (options.systemPrompt) {
    agentConfig.systemPrompt = options.systemPrompt;
  }

  return new ReActAgent(agentConfig);
}

/**
 * Get or create an agent by type with caching
 * Caches agents by session key for performance and state management
 * @param {VectorStoreIndex} index - The document index
 * @param {string} agentType - Agent type: "react" or "openai"
 * Both types use ReActAgent, with the difference being the configured LLM provider
 * @param {string|null} sessionKey - Optional session key for caching
 * @param {Object} options - Agent configuration options
 * @param {string} options.systemPrompt - Optional system prompt for the agent
 * @returns {Promise<ReActAgent>} Configured agent
 */
export async function getAgent(index, agentType = "react", sessionKey = null, options = {}) {
  const cacheKey = `${agentType}-${sessionKey || "default"}`;

  // Return cached agent if available and session-specific
  if (sessionKey && agentCache.has(cacheKey)) {
    return agentCache.get(cacheKey);
  }

  let agent;
  switch (agentType.toLowerCase()) {
    case "openai":
    case "react":
    default:
      // Both "openai" and "react" use ReActAgent
      // The difference is in the configured LLM (Settings.llm)
      agent = createReActAgent(index, [], options);
      break;
  }

  // Cache agent if session key provided
  if (sessionKey) {
    agentCache.set(cacheKey, agent);
  }

  return agent;
}

/**
 * Clear all agents from cache (for session cleanup)
 */
export function clearAgentCache() {
  agentCache.clear();
}

/**
 * Clear specific session from agent cache
 * @param {string} sessionKey - Session key to clear
 */
export function clearSessionAgentCache(sessionKey) {
  for (const [key] of agentCache.keys()) {
    if (key.includes(sessionKey)) {
      agentCache.delete(key);
    }
  }
}

/**
 * Get statistics about agent cache
 * @returns {Object} Cache statistics
 */
export function getAgentCacheStats() {
  return {
    size: agentCache.size,
    keys: Array.from(agentCache.keys()),
  };
}
