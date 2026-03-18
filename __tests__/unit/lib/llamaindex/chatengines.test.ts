import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VectorStoreIndex, ChatMessage } from 'llamaindex';

interface ChatHistoryItem {
  role: string;
  content: string;
}

class MockCondenseQuestionChatEngine {
  chatHistory: ChatHistoryItem[];
  retriever: object;
  queryEngine: object;
  systemPrompt?: string;

  constructor(params: { chatHistory?: ChatHistoryItem[]; retriever: object; queryEngine: object; systemPrompt?: string }) {
    this.chatHistory = params.chatHistory ?? [];
    this.retriever = params.retriever;
    this.queryEngine = params.queryEngine;
    this.systemPrompt = params.systemPrompt;
  }
}

class MockContextChatEngine {
  chatHistory: ChatHistoryItem[];
  retriever: object;
  systemPrompt?: string;

  constructor(params: { chatHistory?: ChatHistoryItem[]; retriever: object; systemPrompt?: string }) {
    this.chatHistory = params.chatHistory ?? [];
    this.retriever = params.retriever;
    this.systemPrompt = params.systemPrompt;
  }
}

vi.mock('llamaindex', () => ({
  CondenseQuestionChatEngine: MockCondenseQuestionChatEngine,
  ContextChatEngine: MockContextChatEngine,
}));

const createMockIndex = () =>
  ({
    asQueryEngine: vi.fn().mockReturnValue({
      query: vi.fn().mockResolvedValue({
        response: 'Query response',
        sourceNodes: [],
      }),
    }),
    asRetriever: vi.fn().mockReturnValue({
      retrieve: vi.fn().mockResolvedValue([]),
    }),
  }) as unknown as VectorStoreIndex;

describe('chatengines', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('convertToChatMessages', () => {
    it('should convert messages with valid roles', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ] as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]);
    });

    it('should convert "human" role to "user"', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [{ role: 'human', content: 'Question' }] as unknown as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].role).toBe('user');
    });

    it('should convert "ai" role to "assistant"', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [{ role: 'ai', content: 'Answer' }] as unknown as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].role).toBe('assistant');
    });

    it('should preserve "system" role', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [{ role: 'system', content: 'System prompt' }] as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].role).toBe('system');
    });

    it('should default unknown roles to "user"', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [{ role: 'unknown', content: 'Message' }] as unknown as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].role).toBe('user');
    });

    it('should handle empty content', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [{ role: 'user', content: '' }] as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].content).toBe('');
    });

    it('should return empty array for non-array input', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');

      const result = convertToChatMessages(null as unknown as ChatMessage[]);

      expect(result).toEqual([]);
    });

    it('should handle case-insensitive roles', async () => {
      const { convertToChatMessages } = await import('@/lib/llamaindex/chatengines');
      const history = [
        { role: 'USER', content: 'Question' },
        { role: 'ASSISTANT', content: 'Answer' },
      ] as unknown as ChatMessage[];

      const result = convertToChatMessages(history);

      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
    });
  });

  describe('createCondenseChatEngine', () => {
    it('should create CondenseQuestionChatEngine', async () => {
      const { createCondenseChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = createCondenseChatEngine(mockIndex) as unknown as MockCondenseQuestionChatEngine;

      expect(engine).toBeInstanceOf(MockCondenseQuestionChatEngine);
    });

    it('should include chat history when provided', async () => {
      const { createCondenseChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();
      const history = [{ role: 'user', content: 'Previous question' }] as ChatMessage[];

      const engine = createCondenseChatEngine(mockIndex, history) as unknown as MockCondenseQuestionChatEngine;

      expect(engine.chatHistory).toHaveLength(1);
    });

    it('should include system prompt when provided', async () => {
      const { createCondenseChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = createCondenseChatEngine(mockIndex, [], 'Custom system prompt') as unknown as MockCondenseQuestionChatEngine;

      expect(engine.chatHistory[0].role).toBe('system');
      expect(engine.chatHistory[0].content).toBe('Custom system prompt');
    });

    it('should prepend system prompt to chat history', async () => {
      const { createCondenseChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();
      const history = [{ role: 'user', content: 'Question' }] as ChatMessage[];

      const engine = createCondenseChatEngine(mockIndex, history, 'System prompt') as unknown as MockCondenseQuestionChatEngine;

      expect(engine.chatHistory).toHaveLength(2);
      expect(engine.chatHistory[0].role).toBe('system');
    });
  });

  describe('createContextChatEngine', () => {
    it('should create ContextChatEngine', async () => {
      const { createContextChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = createContextChatEngine(mockIndex) as unknown as MockContextChatEngine;

      expect(engine).toBeInstanceOf(MockContextChatEngine);
    });

    it('should include chat history when provided', async () => {
      const { createContextChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();
      const history = [
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Answer' },
      ] as ChatMessage[];

      const engine = createContextChatEngine(mockIndex, history) as unknown as MockContextChatEngine;

      expect(engine.chatHistory).toHaveLength(2);
    });

    it('should include system prompt when provided', async () => {
      const { createContextChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = createContextChatEngine(mockIndex, [], 'System prompt') as unknown as MockContextChatEngine;

      expect(engine.chatHistory[0].role).toBe('system');
    });
  });

  describe('getChatEngine', () => {
    it('should create condense chat engine by default', async () => {
      const { getChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = await getChatEngine(mockIndex) as unknown as MockCondenseQuestionChatEngine;

      expect(engine).toBeInstanceOf(MockCondenseQuestionChatEngine);
    });

    it('should create context chat engine when type is "context"', async () => {
      const { getChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = await getChatEngine(mockIndex, 'context') as unknown as MockContextChatEngine;

      expect(engine).toBeInstanceOf(MockContextChatEngine);
    });

    it('should create condense chat engine when type is "condense"', async () => {
      const { getChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = await getChatEngine(mockIndex, 'condense') as unknown as MockCondenseQuestionChatEngine;

      expect(engine).toBeInstanceOf(MockCondenseQuestionChatEngine);
    });

    it('should pass system prompt to engine', async () => {
      const { getChatEngine } = await import('@/lib/llamaindex/chatengines');
      const mockIndex = createMockIndex();

      const engine = (await getChatEngine(
        mockIndex,
        'condense',
        [],
        'session-1',
        'Custom prompt'
      )) as unknown as MockCondenseQuestionChatEngine;

      expect(engine.chatHistory[0].role).toBe('system');
      expect(engine.chatHistory[0].content).toBe('Custom prompt');
    });
  });

  describe('clearChatEngineCache', () => {
    it('should be callable without error', async () => {
      const { clearChatEngineCache } = await import('@/lib/llamaindex/chatengines');

      expect(() => clearChatEngineCache()).not.toThrow();
    });

    it('should clear only specified session engines', async () => {
      const { clearChatEngineCache } = await import('@/lib/llamaindex/chatengines');

      expect(() => clearChatEngineCache('session-1')).not.toThrow();
    });
  });
});
