import {
  RouterQueryEngine,
  SubQuestionQueryEngine,
  QueryEngineTool,
} from "llamaindex";
import { LLMSingleSelector } from "llamaindex";
import { LLMQuestionGenerator } from "llamaindex";
import { Settings } from "@llamaindex/core/global";

const topK = parseInt(process.env.TOP_K_RESULTS || "3");

export function createQueryEngine(index) {
  return index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: topK,
    stream: true,
  });
}

export async function createRouterQueryEngine(index) {
  const vectorEngine = index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: topK,
  });

  return RouterQueryEngine.fromDefaults({
    selector: new LLMSingleSelector({ llm: Settings.llm }),
    queryEngineTools: [
      {
        queryEngine: vectorEngine,
        description: "Good for semantic search and finding relevant information from documents",
      },
    ],
    verbose: process.env.VERBOSE === "true",
  });
}

export function createSubQuestionEngine(index) {
  const queryTool = new QueryEngineTool({
    queryEngine: index.asQueryEngine({
      retrieverMode: "default",
      responseMode: "compact",
      similarityTopK: topK,
    }),
  });

  return SubQuestionQueryEngine.fromDefaults({
    queryEngineTools: [queryTool],
    questionGen: new LLMQuestionGenerator({ llm: Settings.llm }),
  });
}

export function getQueryEngine(index, type = "default") {
  switch (type) {
    case "router":
      return createRouterQueryEngine(index);
    case "subquestion":
      return createSubQuestionEngine(index);
    case "default":
    default:
      return createQueryEngine(index);
  }
}
