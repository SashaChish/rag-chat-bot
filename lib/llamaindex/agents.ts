/**
 * Agent Factory Module
 * Provides factory functions for creating ReActAgent instances
 * with document search capabilities and tool support.
 *
 * Note: In LlamaIndex.TS, the primary agent is ReActAgent.
 * OpenAI-specific functionality is achieved by configuring Settings.llm
 * to use an OpenAI provider, not through a separate OpenAIAgent class.
 */

import { ReActAgent, QueryEngineTool, type ReACTAgentParams } from "llamaindex";
import { Settings } from "@llamaindex/core/global";
import type {
  AgentType,
  IndexType,
  AgentEngineType,
  AgentOptions,
} from "../types";

const topK = parseInt(process.env.TOP_K_RESULTS || "3", 10);

const agentCache = new Map<string, AgentEngineType>();

export function createDocumentSearchTool(
  index: IndexType,
  name: string = "document_search",
): QueryEngineTool {
  const queryEngine = index.asQueryEngine({
    retriever: index.asRetriever({
      similarityTopK: topK,
    }),
  });

  return new QueryEngineTool({
    queryEngine: queryEngine,
    metadata: {
      name: name,
      description:
        "Search through uploaded documents to find relevant information",
    },
  });
}

export function createSummaryTool(index: IndexType): unknown {
  return {
    metadata: {
      name: "summarize_documents",
      description: "Generate a summary of information from uploaded documents",
    },
    queryEngine: index.asQueryEngine(),
  };
}

export function createReActAgent(
  index: IndexType,
  options: AgentOptions = {},
): AgentEngineType {
  const documentSearchTool = createDocumentSearchTool(index);

  const { systemPrompt: _excludedSystemPrompt, ...otherOptions } = options;

  const agentConfig: ReACTAgentParams = {
    tools: [documentSearchTool],
    llm: Settings.llm,
    verbose: options.verbose || process.env.VERBOSE === "true",
    ...otherOptions,
  };

  return new ReActAgent(agentConfig);
}

export async function getAgent(
  index: IndexType,
  agentType: AgentType = "react",
  sessionKey: string | null = null,
  options: AgentOptions = {},
): Promise<AgentEngineType> {
  const cacheKey = `${agentType}-${sessionKey || "default"}`;

  if (sessionKey && agentCache.has(cacheKey)) {
    return agentCache.get(cacheKey)!;
  }

  let agent: AgentEngineType;
  const safeAgentType = agentType?.toLowerCase() || "react";
  switch (safeAgentType) {
    case "openai":
    case "react":
    default:
      agent = createReActAgent(index, options);
      break;
  }

  if (sessionKey) {
    agentCache.set(cacheKey, agent);
  }

  return agent;
}

export function clearAgentCache(): void {
  agentCache.clear();
}

export function clearSessionAgentCache(sessionKey: string): void {
  for (const [key] of agentCache.keys()) {
    if (key.includes(sessionKey)) {
      agentCache.delete(key);
    }
  }
}
export function getAgentCacheStats(): { size: number; keys: string[] } {
  return {
    size: agentCache.size,
    keys: Array.from(agentCache.keys()),
  };
}
