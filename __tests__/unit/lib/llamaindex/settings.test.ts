import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

class MockOpenAI {
  constructor(public params: object) {}
}

class MockOpenAIEmbedding {
  constructor(public params: object) {}
}

class MockAnthropic {
  constructor(public params: object) {}
}

class MockGroq {
  constructor(public params: object) {}
}

class MockOllama {
  constructor(public params: object) {}
}

class MockOllamaEmbedding {
  constructor(public params: object) {}
}

const mockSettings = {
  llm: undefined as unknown,
  embedModel: undefined as unknown,
};

vi.mock('@llamaindex/openai', () => ({
  OpenAI: MockOpenAI,
  OpenAIEmbedding: MockOpenAIEmbedding,
}));

vi.mock('@llamaindex/anthropic', () => ({
  Anthropic: MockAnthropic,
}));

vi.mock('@llamaindex/groq', () => ({
  Groq: MockGroq,
}));

vi.mock('@llamaindex/ollama', () => ({
  Ollama: MockOllama,
  OllamaEmbedding: MockOllamaEmbedding,
}));

vi.mock('@llamaindex/core/global', () => ({
  Settings: mockSettings,
}));

describe('settings', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockSettings.llm = undefined;
    mockSettings.embedModel = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('configureLLM', () => {
    it('should configure OpenAI LLM when provider is openai', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.LLM_MODEL = 'gpt-4';

      const { configureLLM } = await import('@/lib/llamaindex/settings');
      const result = configureLLM();

      expect(mockSettings.llm).toBeInstanceOf(MockOpenAI);
      expect(result).toBeInstanceOf(MockOpenAI);
    });

    it('should throw error when OPENAI_API_KEY is missing', async () => {
      process.env.LLM_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;

      const { configureLLM } = await import('@/lib/llamaindex/settings');

      expect(() => configureLLM()).toThrow('OPENAI_API_KEY is required when using OpenAI provider');
    });

    it('should configure Anthropic LLM when provider is anthropic', async () => {
      process.env.LLM_PROVIDER = 'anthropic';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.LLM_MODEL = 'claude-3-opus';

      const { configureLLM } = await import('@/lib/llamaindex/settings');
      const result = configureLLM();

      expect(mockSettings.llm).toBeInstanceOf(MockAnthropic);
      expect(result).toBeInstanceOf(MockAnthropic);
    });

    it('should throw error when ANTHROPIC_API_KEY is missing', async () => {
      process.env.LLM_PROVIDER = 'anthropic';
      delete process.env.ANTHROPIC_API_KEY;

      const { configureLLM } = await import('@/lib/llamaindex/settings');

      expect(() => configureLLM()).toThrow('ANTHROPIC_API_KEY is required when using Anthropic provider');
    });

    it('should configure Groq LLM when provider is groq', async () => {
      process.env.LLM_PROVIDER = 'groq';
      process.env.GROQ_API_KEY = 'test-groq-key';
      process.env.LLM_MODEL = 'llama-3.1-70b';

      const { configureLLM } = await import('@/lib/llamaindex/settings');
      const result = configureLLM();

      expect(mockSettings.llm).toBeInstanceOf(MockGroq);
      expect(result).toBeInstanceOf(MockGroq);
    });

    it('should throw error when GROQ_API_KEY is missing', async () => {
      process.env.LLM_PROVIDER = 'groq';
      delete process.env.GROQ_API_KEY;

      const { configureLLM } = await import('@/lib/llamaindex/settings');

      expect(() => configureLLM()).toThrow('GROQ_API_KEY is required when using Groq provider');
    });

    it('should configure Ollama LLM when provider is ollama', async () => {
      process.env.LLM_PROVIDER = 'ollama';
      process.env.OLLAMA_MODEL = 'llama3.2';

      const { configureLLM } = await import('@/lib/llamaindex/settings');
      const result = configureLLM();

      expect(mockSettings.llm).toBeInstanceOf(MockOllama);
      expect(result).toBeInstanceOf(MockOllama);
    });

    it('should throw error for unsupported provider', async () => {
      process.env.LLM_PROVIDER = 'unsupported';

      const { configureLLM } = await import('@/lib/llamaindex/settings');

      expect(() => configureLLM()).toThrow(
        'Unsupported LLM provider: unsupported. Supported providers: openai, anthropic, groq, ollama'
      );
    });
  });

  describe('configureEmbedding', () => {
    it('should configure OpenAI embedding when provider is openai', async () => {
      process.env.EMBEDDING_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.EMBEDDING_MODEL = 'text-embedding-3-large';

      const { configureEmbedding } = await import('@/lib/llamaindex/settings');
      const result = configureEmbedding();

      expect(mockSettings.embedModel).toBeInstanceOf(MockOpenAIEmbedding);
      expect(result).toBeInstanceOf(MockOpenAIEmbedding);
    });

    it('should throw error when OPENAI_API_KEY is missing for embeddings', async () => {
      process.env.EMBEDDING_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;

      const { configureEmbedding } = await import('@/lib/llamaindex/settings');

      expect(() => configureEmbedding()).toThrow('OPENAI_API_KEY is required for OpenAI embeddings');
    });

    it('should configure Ollama embedding when provider is ollama', async () => {
      process.env.EMBEDDING_PROVIDER = 'ollama';
      process.env.OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';

      const { configureEmbedding } = await import('@/lib/llamaindex/settings');
      const result = configureEmbedding();

      expect(mockSettings.embedModel).toBeInstanceOf(MockOllamaEmbedding);
      expect(result).toBeInstanceOf(MockOllamaEmbedding);
    });

    it('should throw error for unsupported embedding provider', async () => {
      process.env.EMBEDDING_PROVIDER = 'unsupported';

      const { configureEmbedding } = await import('@/lib/llamaindex/settings');

      expect(() => configureEmbedding()).toThrow(
        'Unsupported embedding provider: unsupported. Supported providers: openai, ollama'
      );
    });
  });

  describe('initializeSettings', () => {
    it('should call configureLLM and configureEmbedding', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';

      const { initializeSettings } = await import('@/lib/llamaindex/settings');

      initializeSettings();

      expect(mockSettings.llm).toBeInstanceOf(MockOpenAI);
      expect(mockSettings.embedModel).toBeInstanceOf(MockOpenAIEmbedding);
    });
  });

  describe('updateLLMProvider', () => {
    it('should update LLM provider and model', async () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

      const { updateLLMProvider } = await import('@/lib/llamaindex/settings');

      updateLLMProvider('anthropic', 'claude-3-opus');

      expect(process.env.LLM_PROVIDER).toBe('anthropic');
      expect(process.env.LLM_MODEL).toBe('claude-3-opus');
    });
  });

  describe('getLLMConfig', () => {
    it('should return current LLM configuration', async () => {
      process.env.LLM_PROVIDER = 'anthropic';
      process.env.LLM_MODEL = 'claude-3-opus';

      const { getLLMConfig } = await import('@/lib/llamaindex/settings');
      const config = getLLMConfig();

      expect(config).toEqual({
        provider: 'anthropic',
        model: 'claude-3-opus',
      });
    });

    it('should return defaults when env vars are not set', async () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_MODEL;

      const { getLLMConfig } = await import('@/lib/llamaindex/settings');
      const config = getLLMConfig();

      expect(config).toEqual({
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
    });
  });
});
