import { describe, it, expect, afterEach } from 'vitest';
import { getSystemPrompt, getDefaultSystemPrompt } from '@/lib/llamaindex/prompts';

describe('getSystemPrompt', () => {
  afterEach(() => {
    delete process.env.SYSTEM_PROMPT;
  });

  it('should return default system prompt when no options provided', () => {
    const result = getSystemPrompt();
    expect(result).toBe(getDefaultSystemPrompt());
  });

  it('should return default system prompt when options object is empty', () => {
    const result = getSystemPrompt({});
    expect(result).toBe(getDefaultSystemPrompt());
  });

  it('should return custom prompt when provided in options', () => {
    const customPrompt = 'You are a helpful assistant.';
    const result = getSystemPrompt({ customPrompt });
    expect(result).toBe(customPrompt);
  });

  it('should use environment variable SYSTEM_PROMPT when set', () => {
    const envPrompt = 'You are an environment-based assistant.';
    process.env.SYSTEM_PROMPT = envPrompt;

    const result = getSystemPrompt();

    expect(result).toBe(envPrompt);
  });

  it('should prioritize custom prompt over environment variable', () => {
    const envPrompt = 'You are an environment-based assistant.';
    const customPrompt = 'You are a custom assistant.';
    process.env.SYSTEM_PROMPT = envPrompt;

    const result = getSystemPrompt({ customPrompt });

    expect(result).toBe(customPrompt);
    expect(result).not.toBe(envPrompt);
  });

  it('should ignore environment variable when custom prompt is provided', () => {
    process.env.SYSTEM_PROMPT = 'Environment prompt';
    const customPrompt = 'Custom prompt';

    const result = getSystemPrompt({ customPrompt });

    expect(result).toBe(customPrompt);
  });

  it('should handle empty custom prompt string as falsy', () => {
    const result = getSystemPrompt({ customPrompt: '' });
    expect(result).toBe(getDefaultSystemPrompt());
  });

  it('should handle environment variable with empty string as falsy', () => {
    process.env.SYSTEM_PROMPT = '';

    const result = getSystemPrompt();

    expect(result).toBe(getDefaultSystemPrompt());
  });

  it('should return default prompt when custom prompt is undefined', () => {
    const result = getSystemPrompt({ customPrompt: undefined });
    expect(result).toBe(getDefaultSystemPrompt());
  });
});

describe('getDefaultSystemPrompt', () => {
  it('should return a string with RAG instructions', () => {
    const prompt = getDefaultSystemPrompt();
    expect(typeof prompt).toBe('string');
  });

  it('should contain context section placeholder', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('{{context will be inserted here}}');
  });

  it('should contain instructions for answering questions', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('Answer Questions');
  });

  it('should contain instructions for citations', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('Citations');
  });

  it('should contain instructions for handling insufficient context', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('When Context is Insufficient');
  });

  it('should contain answer style instructions', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('Answer Style');
  });

  it('should contain uncertainty instructions', () => {
    const prompt = getDefaultSystemPrompt();
    expect(prompt).toContain('Uncertainty');
  });

  it('should have consistent default prompt across calls', () => {
    const prompt1 = getDefaultSystemPrompt();
    const prompt2 = getDefaultSystemPrompt();
    expect(prompt1).toBe(prompt2);
  });
});
