# LlamaIndex.TS Improvements Specification

## Overview

This document outlines potential improvements to the RAG Chatbot project based on available LlamaIndex.TS features that are not currently implemented.

---

## Current Implementation Status

### Currently Using

| Feature          | LlamaIndex.TS Component                                       | Status         |
| ---------------- | ------------------------------------------------------------- | -------------- |
| Document Loading | `PDFReader`, `DocxReader`, `MarkdownReader`, `TextFileReader` | ✅ Implemented |
| Text Splitting   | `SentenceSplitter`                                            | ✅ Implemented |
| Embeddings       | `OpenAIEmbedding`, `OllamaEmbedding`                          | ✅ Implemented |
| LLM Integration  | `OpenAI`, `Anthropic`, `Groq`, `Ollama`                       | ✅ Implemented |
| Global Settings  | `Settings` from `@llamaindex/core/global`                     | ✅ Implemented |
| Streaming        | Manual SSE implementation                                     | ✅ Implemented |

### Not Currently Using

| Feature            | LlamaIndex.TS Component                                               | Priority  |
| ------------------ | --------------------------------------------------------------------- | --------- |
| Vector Store Index | `VectorStoreIndex`, `ChromaVectorStore`                               | 🔴 High   |
| Query Engines      | `RetrieverQueryEngine`, `RouterQueryEngine`, `SubQuestionQueryEngine` | 🔴 High   |
| Chat Engines       | `CondenseQuestionChatEngine`, `ContextChatEngine`                     | 🔴 High   |
| Agents             | `ReActAgent`, `OpenAIAgent`, `@llamaindex/workflow`                   | 🟡 Medium |
| Evaluators         | `RelevancyEvaluator`, `FaithfulnessEvaluator`, `CorrectnessEvaluator` | 🟡 Medium |
| Post-Processors    | `SimilarityPostprocessor`, `CohereRerank`                             | 🟡 Medium |
| Extractors         | `TitleExtractor`, `KeywordExtractor`, `SummaryExtractor`              | 🟢 Low    |
| Advanced Parsers   | `SentenceWindowNodeParser`, `MarkdownNodeParser`                      | 🟢 Low    |
| Multiple Indexes   | `SummaryIndex`, `KeywordTableIndex`, `KnowledgeGraphIndex`            | 🟢 Low    |
| Workflows          | `@llamaindex/workflow` for orchestration                              | 🟢 Low    |

---

## Improvement Specifications

### 1. Vector Storage - Use Native LlamaIndex.TS Vector Stores

**Priority**: High ✅ **COMPLETED**
**Complexity**: Low
**Impact**: Code simplification, better performance, easier migration

#### Current Implementation

Uses ChromaDB directly with manual wrapper operations in `lib/llamaindex/vectorstore.js`.

#### Proposed Implementation

Replace manual ChromaDB operations with `VectorStoreIndex` and `ChromaVectorStore` from LlamaIndex.TS.

```typescript
import { VectorStoreIndex } from "llamaindex";
import { ChromaVectorStore } from "llamaindex";
import { Settings } from "@llamaindex/core/global";

// Initialize index with native vector store
export async function createIndex(documents) {
  const index = await VectorStoreIndex.fromDocuments(documents, {
    vectorStore: new ChromaVectorStore({ collection: "documents" }),
    serviceContext: Settings.serviceContext,
  });

  return index;
}

// Query using native query engine
export async function queryIndex(query, index) {
  const queryEngine = index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: parseInt(process.env.TOP_K_RESULTS || "3"),
  });

  const response = await queryEngine.query({ query });

  return {
    response: response.toString(),
    sources: response.sourceNodes.map((node) => ({
      text: node.node.getContent(),
      metadata: node.node.metadata,
      score: node.score,
    })),
  };
}
```

#### Benefits

- Automatic embedding persistence
- Simplified query logic
- Built-in streaming support
- Easier migration to other vector stores (Pinecone, Qdrant, etc.)
- Better integration with other LlamaIndex.TS components

#### Files to Modify

- `lib/llamaindex/index.js` - Replace manual embedding/query logic
- `lib/llamaindex/vectorstore.js` - May be deprecated or simplified
- `app/api/chat/route.js` - Use new query methods

---

### 2. Query Engine - Implement Built-in Query Engines

**Priority**: High ✅ **COMPLETED**
**Complexity**: Low
**Impact**: Better query handling, simplified code

#### Current Implementation

Manual query implementation with manual context building and prompt engineering in `lib/llamaindex/index.js`.

#### Proposed Implementation

Use LlamaIndex.TS's built-in query engines.

```typescript
import {
  RetrieverQueryEngine,
  RouterQueryEngine,
  SubQuestionQueryEngine,
} from "llamaindex";
import { LLMSingleSelector } from "llamaindex";

// Basic query engine
export function createQueryEngine(index) {
  return index.asQueryEngine({
    retrieverMode: "default",
    responseMode: "compact",
    similarityTopK: parseInt(process.env.TOP_K_RESULTS || "3"),
    stream: true,
  });
}

// Router query engine for multiple indexes
export async function createRouterQueryEngine() {
  const vectorIndex = await loadVectorIndex();
  const summaryIndex = await loadSummaryIndex();
  const keywordIndex = await loadKeywordIndex();

  const routerEngine = new RouterQueryEngine({
    selector: new LLMSingleSelector(Settings.llm),
    queryEngines: [
      {
        queryEngine: vectorIndex.asQueryEngine(),
        description:
          "Good for semantic search and finding relevant information",
      },
      {
        queryEngine: summaryIndex.asQueryEngine(),
        description: "Good for summarizing documents and getting overviews",
      },
      {
        queryEngine: keywordIndex.asQueryEngine(),
        description: "Good for finding specific terms and exact matches",
      },
    ],
  });

  return routerEngine;
}

// Sub-question query engine for complex queries
export function createSubQuestionEngine(index) {
  return new SubQuestionQueryEngine({
    retriever: index.asRetriever(),
    questionGen: new LLMQuestionGenerator({
      llm: Settings.llm,
    }),
  });
}
```

#### Benefits

- Automatic query routing to best engine
- Better handling of complex multi-part queries
- Built-in response modes (compact, tree_summarize, refine)
- Native streaming support

#### Files to Modify

- `lib/llamaindex/index.js` - Add query engine factory functions
- `app/api/chat/route.js` - Use query engines instead of manual logic

#### Implementation Notes

**Completed on**: 2026-03-07

**Changes Made**:

- Created `lib/llamaindex/queryengines.js` with factory functions:
  - `createQueryEngine()` - Basic query engine with streaming support
  - `createRouterQueryEngine()` - Router query engine for multi-index routing (foundation for future expansion)
  - `createSubQuestionEngine()` - Sub-question query engine for complex queries
  - `getQueryEngine()` - Factory function to select appropriate engine
- Updated `lib/llamaindex/index.js`:
  - Imported query engine factory functions
  - Added `queryEngineType` parameter to `executeQuery()`
  - Integrated query engine factory for engine selection
  - Maintained backward compatibility with streaming support
- Updated `app/api/chat/route.js`:
  - Added `queryEngineType` parameter support in request body
  - Passes query engine type to executeQuery function

**Usage**:
Send requests with `queryEngineType` parameter:

```json
{
  "message": "What is the main topic?",
  "queryEngineType": "default" // Options: "default", "router", "subquestion"
}
```

**Environment Variables**:

- `TOP_K_RESULTS` - Number of top results to retrieve (default: "3")
- `VERBOSE` - Enable verbose logging for router engine (default: "false")

**Next Steps**:

- Add multiple index types (summary, keyword) to enable full router engine functionality
- Add UI toggle for query engine selection in Chat component

---

### 3. Chat Engine - Use Native Chat Engines

**Priority**: High ✅ **COMPLETED**
**Complexity**: Low
**Impact**: Better conversation management

#### Current Implementation

Manual chat implementation without proper conversation history management.

#### Proposed Implementation

Use LlamaIndex.TS's built-in chat engines.

```typescript
import { CondenseQuestionChatEngine, ContextChatEngine } from "llamaindex";
import { SimpleChatHistory } from "llamaindex";

// Chat engine with conversation history
export function createChatEngine(index) {
  return new CondenseQuestionChatEngine({
    retriever: index.asRetriever(),
    llm: Settings.llm,
    memory: new SimpleChatHistory(), // Manages conversation history
    verbose: true,
  });
}

// Chat engine with custom context
export function createContextChatEngine(index, context) {
  return new ContextChatEngine({
    retriever: index.asRetriever(),
    llm: Settings.llm,
    context: context,
  });
}

// Chat with history management
export async function chat(message, chatEngine) {
  const response = await chatEngine.chat({
    message: message,
    stream: true,
  });

  return {
    response: response,
    history: chatEngine.chatHistory,
  };
}
```

#### Benefits

- Automatic conversation history management
- Context condensation for efficient queries
- Follow-up question handling
- Better memory for multi-turn conversations

#### Files to Modify

- `lib/llamaindex/index.js` - Add chat engine factory functions
- `app/api/chat/route.js` - Use chat engines for conversation management

---

### 4. Agents - Implement Agentic Capabilities

**Priority**: Medium ✅ **COMPLETED**
**Complexity**: Medium
**Impact**: More powerful, autonomous interactions

#### Current Implementation

No agent functionality - just simple Q&A.

#### Proposed Implementation

Add agents for more powerful interactions.

```typescript
import { ReActAgent, OpenAIAgent, QueryEngineTool } from "llamaindex";
import { agent, tool } from "@llamaindex/workflow";

// ReAct Agent
export function createReActAgent(index) {
  const queryTool = new QueryEngineTool({
    queryEngine: index.asQueryEngine(),
    metadata: {
      name: "document_search",
      description: "Search through uploaded documents to find information",
    },
  });

  const myAgent = new ReActAgent({
    tools: [queryTool],
    llm: Settings.llm,
    verbose: true,
    maxIterations: 10,
  });

  return myAgent;
}

// OpenAI Agent with function calling
export function createOpenAIAgent(index) {
  const queryTool = new QueryEngineTool({
    queryEngine: index.asQueryEngine(),
    metadata: {
      name: "document_search",
      description: "Search through uploaded documents",
    },
  });

  const myAgent = new OpenAIAgent({
    tools: [queryTool],
    llm: Settings.llm,
  });

  return myAgent;
}

// Workflow Agent
import { openai } from "@llamaindex/openai";

export function createWorkflowAgent(index) {
  const myAgent = agent({
    llm: openai({ model: "gpt-4o" }),
    tools: [index.queryTool()],
    systemPrompt:
      "You are a helpful assistant that searches documents to answer questions.",
  });

  return myAgent;
}

// Custom tool for agent
export function createSummaryTool(index) {
  return tool({
    name: "summarize_document",
    description: "Summarize the contents of uploaded documents",
    fn: async (topic) => {
      const query = `Provide a summary about ${topic}`;
      const response = await index.asQueryEngine().query({ query });
      return response.toString();
    },
  });
}
```

#### Benefits

- Tool use for extended capabilities
- Reasoning + action patterns
- Multi-step problem solving
- Integration with external tools (web search, APIs, etc.)

#### Files to Modify

- `lib/llamaindex/index.js` - Add agent factory functions
- `app/api/chat/route.js` - Add agent mode option
- `components/Chat.jsx` - Add agent mode UI toggle

---

### 5. Response Evaluation - Add Quality Metrics

**Priority**: Medium
**Complexity**: Medium
**Impact**: Quality assurance, better UX

#### Current Implementation

No evaluation of response quality.

#### Proposed Implementation

Use LlamaIndex.TS's built-in evaluators.

```typescript
import {
  RelevancyEvaluator,
  FaithfulnessEvaluator,
  CorrectnessEvaluator,
} from "llamaindex";

// Initialize evaluators
const relevancyEvaluator = new RelevancyEvaluator();
const faithfulnessEvaluator = new FaithfulnessEvaluator();
const correctnessEvaluator = new CorrectnessEvaluator();

// Evaluate a response
export async function evaluateResponse(query, response, contexts) {
  const results = {};

  // Check if response is relevant to query and contexts
  const relevancyResult = await relevancyEvaluator.evaluate({
    query: query,
    response: response,
    contexts: contexts.map((c) => c.getContent()),
  });
  results.relevancy = {
    score: relevancyResult.score,
    feedback: relevancyResult.feedback,
  };

  // Check if response is faithful to retrieved contexts
  const faithfulnessResult = await faithfulnessEvaluator.evaluate({
    query: query,
    response: response,
    contexts: contexts.map((c) => c.getContent()),
  });
  results.faithfulness = {
    score: faithfulnessResult.score,
    feedback: faithfulnessResult.feedback,
  };

  return results;
}

// Batch evaluation for testing
export async function evaluateBatch(testCases) {
  const results = [];

  for (const testCase of testCases) {
    const evaluation = await evaluateResponse(
      testCase.query,
      testCase.response,
      testCase.contexts,
    );
    results.push({
      query: testCase.query,
      expected: testCase.expected,
      actual: testCase.response,
      evaluation,
    });
  }

  return results;
}
```

#### Benefits

- Quality assurance for responses
- Identify hallucinations
- Improve user trust with quality scores
- Enable A/B testing of different configurations

#### Files to Create

- `lib/llamaindex/evaluators.js` - New file for evaluation logic

#### Files to Modify

- `app/api/chat/route.js` - Add evaluation option and return scores
- `components/Chat.jsx` - Display quality indicators

---

### 6. Post-Processing - Improve Retrieved Results

**Priority**: Medium
**Complexity**: Low
**Impact**: Better retrieval quality

#### Current Implementation

Basic similarity search without result refinement.

#### Proposed Implementation

Add post-processors for result filtering and reranking.

```typescript
import { SimilarityPostprocessor } from "llamaindex";
import { CohereRerank } from "@llamaindex/cohere";

// Similarity filtering
export function createRetrieverWithFilter(index) {
  return index.asRetriever({
    similarityPostprocessor: new SimilarityPostprocessor({
      similarityCutoff: 0.7, // Filter results below 0.7 similarity
    }),
    similarityTopK: parseInt(process.env.TOP_K_RESULTS || "5"), // Get more, filter down
  });
}

// Reranking for better results
export function createRetrieverWithRerank(index) {
  return index.asRetriever({
    nodePostprocessors: [
      new CohereRerank({
        topN: parseInt(process.env.TOP_K_RESULTS || "3"),
        apiKey: process.env.COHERE_API_KEY,
        model: "rerank-english-v2.0",
      }),
    ],
  });
}

// Combined post-processing
export function createEnhancedRetriever(index) {
  return index.asRetriever({
    similarityPostprocessor: new SimilarityPostprocessor({
      similarityCutoff: 0.5,
    }),
    nodePostprocessors: [
      new CohereRerank({
        topN: 3,
        apiKey: process.env.COHERE_API_KEY,
      }),
    ],
  });
}
```

#### Benefits

- Higher quality retrieved documents
- Reduced noise in results
- Better context for LLM responses
- Configurable quality thresholds

#### Files to Create

- `lib/llamaindex/postprocessors.js` - New file for post-processing logic

#### Files to Modify

- `lib/llamaindex/index.js` - Use enhanced retrievers
- `.env.example` - Add COHERE_API_KEY

---

### 7. Document Extraction - Add Metadata Extraction

**Priority**: Low
**Complexity**: Low
**Impact**: Better metadata, improved search

#### Current Implementation

Minimal metadata extraction (just file info).

#### Proposed Implementation

Use LlamaIndex.TS's built-in extractors.

```typescript
import {
  TitleExtractor,
  KeywordExtractor,
  SummaryExtractor,
  QuestionsAnsweredExtractor,
} from "llamaindex";

// Extract titles from documents
export async function extractTitles(documents) {
  const titleExtractor = new TitleExtractor({
    llm: Settings.llm,
    nodes: 5, // Extract from first 5 nodes
  });

  const nodes = await titleExtractor(documents);
  return nodes;
}

// Extract keywords
export async function extractKeywords(documents) {
  const keywordExtractor = new KeywordExtractor({
    llm: Settings.llm,
    keywords: 10, // Extract top 10 keywords
  });

  const nodes = await keywordExtractor(documents);
  return nodes;
}

// Generate summaries
export async function generateSummaries(documents) {
  const summaryExtractor = new SummaryExtractor({
    llm: Settings.llm,
    summaryPrompt: "Provide a brief summary of this document",
  });

  const nodes = await summaryExtractor(documents);
  return nodes;
}

// Extract Q&A pairs
export async function extractQA(documents) {
  const qaExtractor = new QuestionsAnsweredExtractor({
    llm: Settings.llm,
    questions: 5, // Extract 5 Q&A pairs
  });

  const nodes = await qaExtractor(documents);
  return nodes;
}

// Combined extraction pipeline
export async function extractMetadata(documents) {
  const ingestionPipeline = new IngestionPipeline({
    transformations: [
      new TitleExtractor({ llm: Settings.llm }),
      new KeywordExtractor({ llm: Settings.llm }),
      new SummaryExtractor({ llm: Settings.llm }),
    ],
  });

  const nodes = await ingestionPipeline.run({ documents });
  return nodes;
}
```

#### Benefits

- Better search with keywords
- Document summaries for quick preview
- Structured Q&A from documents
- Enhanced metadata for filtering

#### Files to Create

- `lib/llamaindex/extractors.js` - New file for extraction logic

#### Files to Modify

- `lib/llamaindex/index.js` - Add extraction to document processing
- `components/DocumentList.jsx` - Display extracted metadata

---

### 8. Node Parsing - Advanced Text Processing

**Priority**: Low
**Complexity**: Low
**Impact**: Better context for chunks

#### Current Implementation

Only uses basic `SentenceSplitter`.

#### Proposed Implementation

Use more advanced node parsers.

```typescript
import { SentenceWindowNodeParser, MarkdownNodeParser } from "llamaindex";

// Sentence window parser with context
export function createWindowNodeParser() {
  return new SentenceWindowNodeParser({
    windowSize: parseInt(process.env.WINDOW_SIZE || "3"),
    windowMetadataKey: "window",
    originalTextMetadataKey: "original_text",
  });
}

// Markdown-specific parser
export function createMarkdownParser() {
  return new MarkdownNodeParser();
}

// Window post-processor to use context
export function createWindowPostProcessor() {
  return {
    postprocessNodes: (nodes) => {
      return nodes.map((node) => ({
        ...node,
        content: node.node.metadata.window || node.node.getContent(),
      }));
    },
  };
}

// Use with index
export async function indexWithWindowParser(documents) {
  const nodeParser = createWindowNodeParser();
  const nodes = await nodeParser.getNodesFromDocuments(documents);

  const index = await VectorStoreIndex.fromDocuments(nodes);
  return index;
}
```

#### Benefits

- Better context for each chunk
- Improved retrieval accuracy
- Specialized parsing for different file types
- Reduces out-of-context issues

#### Files to Modify

- `lib/llamaindex/index.js` - Add advanced parser options

---

### 9. Index Types - Support Multiple Index Types

**Priority**: Low
**Complexity**: Medium
**Impact**: More query options, specialized use cases

#### Current Implementation

Only basic vector similarity search.

#### Proposed Implementation

Add specialized index types.

```typescript
import { SummaryIndex, KeywordTableIndex } from "llamaindex";
import { KeywordTableSimpleRetriever } from "llamaindex";

// Summary index for document overviews
export async function createSummaryIndex(documents) {
  const summaryIndex = await SummaryIndex.fromDocuments(documents);
  return summaryIndex;
}

// Keyword index for exact matching
export async function createKeywordIndex(documents) {
  const keywordIndex = await KeywordTableIndex.fromDocuments(documents, {
    retrieverMode: "simple", // or "rake"
  });
  return keywordIndex;
}

// Combined query with multiple indexes
export async function queryAllIndexes(
  query,
  vectorIndex,
  summaryIndex,
  keywordIndex,
) {
  // Query all indexes in parallel
  const [vectorResults, summaryResults, keywordResults] = await Promise.all([
    vectorIndex.asQueryEngine().query({ query }),
    summaryIndex.asQueryEngine().query({ query }),
    keywordIndex.asQueryEngine().query({ query }),
  ]);

  return {
    vector: vectorResults,
    summary: summaryResults,
    keyword: keywordResults,
  };
}

// Index manager for multiple index types
export class MultiIndexManager {
  constructor() {
    this.indexes = {};
  }

  addIndex(name, index, description) {
    this.indexes[name] = { index, description };
  }

  getIndex(name) {
    return this.indexes[name]?.index;
  }

  async queryWithRouter(query) {
    const routerEngine = new RouterQueryEngine({
      selector: new LLMSingleSelector(Settings.llm),
      queryEngines: Object.entries(this.indexes).map(([name, data]) => ({
        queryEngine: data.index.asQueryEngine(),
        description: data.description,
      })),
    });

    return await routerEngine.query({ query });
  }
}
```

#### Benefits

- Different retrieval strategies for different queries
- Summary retrieval for overviews
- Keyword search for exact matches
- Flexible query routing

#### Files to Create

- `lib/llamaindex/multi-index.js` - New file for multi-index management

---

### 10. Workflows - Add Orchestration

**Priority**: Low
**Complexity**: High
**Impact**: Advanced multi-agent coordination

#### Current Implementation

No workflow orchestration for complex tasks.

#### Proposed Implementation

Use `@llamaindex/workflow` for orchestration.

```typescript
import { agent, tool, Task } from "@llamaindex/workflow";
import { openai } from "@llamaindex/openai";

// Create custom tools
const searchTool = tool({
  name: "document_search",
  description: "Search through uploaded documents",
  fn: async (query) => {
    const results = await index.asQueryEngine().query({ query });
    return results.toString();
  },
});

const summarizeTool = tool({
  name: "summarize",
  description: "Summarize the given text",
  fn: async (text) => {
    const response = await Settings.llm.complete({
      prompt: `Summarize this text: ${text}`,
    });
    return response.text;
  },
});

// Create workflow agent
export function createWorkflowAgent() {
  const myAgent = agent({
    llm: openai({ model: "gpt-4o" }),
    tools: [searchTool, summarizeTool],
    systemPrompt:
      "You are a research assistant. Search documents and provide accurate, well-sourced answers.",
  });

  return myAgent;
}

// Multi-step workflow
export async function researchWorkflow(topic) {
  const myAgent = createWorkflowAgent();

  const result = await myAgent.run(`
    Research this topic: ${topic}
    
    Steps:
    1. Search for information in documents
    2. Summarize key findings
    3. Identify any gaps or uncertainties
    4. Provide a comprehensive answer with sources
  `);

  return result;
}

// Task-based workflow
export function createTaskWorkflow() {
  const myAgent = createWorkflowAgent();

  const task1 = new Task({
    name: "search",
    description: "Search for relevant documents",
    agent: myAgent,
  });

  const task2 = new Task({
    name: "summarize",
    description: "Summarize findings",
    agent: myAgent,
    dependencies: [task1],
  });

  return [task1, task2];
}
```

#### Benefits

- Complex task orchestration
- Multi-step processing
- Tool chaining
- Advanced agent coordination

#### Files to Create

- `lib/llamaindex/workflows.js` - New file for workflow logic

#### Files to Modify

- `package.json` - Add `@llamaindex/workflow` dependency

---

## Implementation Roadmap

### Phase 1: High Priority (Quick Wins)

1. Implement `VectorStoreIndex` with `ChromaVectorStore`
2. Add built-in `RetrieverQueryEngine`
3. Implement `CondenseQuestionChatEngine` for proper chat history

**Estimated Time**: 2-3 days

### Phase 2: Medium Priority (Enhanced Features)

4. Add `ReActAgent` for tool use
5. Implement evaluation metrics (Relevancy, Faithfulness)
6. Add post-processors for result filtering/reranking

**Estimated Time**: 3-4 days

### Phase 3: Low Priority (Advanced Features)

7. Add document extractors (Title, Keywords, Summary)
8. Implement advanced node parsers (SentenceWindow)
9. Add multiple index types (Summary, Keyword)
10. Implement workflows for orchestration

**Estimated Time**: 5-7 days

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@llamaindex/cohere": "^0.1.0",
    "@llamaindex/workflow": "^0.1.0",
    "@llamaindex/chroma": "^0.1.0"
  }
}
```

## Environment Variables to Add

```env
# Evaluation
ENABLE_EVALUATION=false

# Reranking
COHERE_API_KEY=

# Advanced Parsing
WINDOW_SIZE=3

# Query Engine
DEFAULT_QUERY_ENGINE=router
ENABLE_SUB_QUESTION=false

# Chat Engine
CHAT_ENGINE_TYPE=condense

# Agent
ENABLE_AGENT=false
AGENT_TYPE=react
```

---

## Testing Strategy

### Unit Tests

- Test each new module independently
- Mock LLM responses for reliable testing
- Test error handling

### Integration Tests

- Test full RAG pipeline with new components
- Test agent workflows
- Test evaluation metrics

### Performance Tests

- Compare query times before/after
- Test with large document sets
- Monitor memory usage

### Quality Tests

- Run evaluation on test queries
- Compare responses across different configurations
- A/B test different retrieval strategies

---

## Migration Notes

### Breaking Changes

- API response format may change with native query engines
- Document metadata structure may be enhanced

### Backward Compatibility

- Keep existing API endpoints
- Add new features as optional/enhancements
- Provide fallback to manual implementation if needed

### Rollback Plan

- Keep original implementation in separate files
- Use feature flags to switch between implementations
- Monitor metrics during rollout

---

## References

- [LlamaIndex.TS API Documentation](https://ts.llamaindex.ai/api/)
- [LlamaIndex Python Docs](https://docs.llamaindex.ai/)
- [LlamaIndex Developers Portal](https://developers.llamaindex.ai/)
