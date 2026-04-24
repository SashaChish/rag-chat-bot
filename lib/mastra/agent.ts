import { Agent } from "@mastra/core/agent";
import { createVectorQueryTool } from "@mastra/rag";
import { getEmbeddingModel, getLanguageModel, getModelString } from "./config";
import { INDEX_NAME, getVectorStore } from "./vectorstore";
import { getDefaultInstructions } from "./prompts";

export function createAgent(options: {
  id: string;
  name: string;
  instructions?: string;
  model?: string;
}) {
  const vectorQueryTool = createVectorQueryTool({
    vectorStore: getVectorStore(),
    indexName: INDEX_NAME,
    model: getEmbeddingModel(),
    reranker: {
      model: getLanguageModel(),
      options: {
        weights: { semantic: 0.5, vector: 0.3, position: 0.2 },
        topK: 5,
      },
    },
  });

  return new Agent({
    id: options.id,
    name: options.name,
    instructions: options.instructions ?? getDefaultInstructions(),
    model: options.model ?? getModelString(),
    tools: { vectorQueryTool },
  });
}
