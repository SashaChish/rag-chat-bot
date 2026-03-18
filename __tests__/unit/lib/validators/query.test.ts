import { describe, it, expect } from 'vitest';
import {
  validateQuery as validateQueryValidator,
  validateQueryEngineType,
  validateChatEngineType,
  validateAgentType,
  validateSessionKey,
} from '@/lib/validators/query.validators';

describe('Query Validators', () => {
  describe('validateQuery', () => {
    it('should throw error for empty string', () => {
      expect(() => validateQueryValidator('')).toThrow('Query cannot be empty');
    });

    it('should throw error for whitespace only', () => {
      expect(() => validateQueryValidator('   ')).toThrow('Query cannot be empty');
    });

    it('should throw error for query shorter than 5 characters', () => {
      expect(() => validateQueryValidator('test')).toThrow('Query must be at least 5 characters long');
    });

    it('should return true for valid query', () => {
      expect(() => validateQueryValidator('Hello world')).not.toThrow();
    });

    it('should return true for query exactly 5 characters', () => {
      expect(() => validateQueryValidator('Hello')).not.toThrow();
    });

    it('should throw error for query longer than 1000 characters', () => {
      const longQuery = 'a'.repeat(1001);
      expect(() => validateQueryValidator(longQuery)).toThrow('Query must be less than 1000 characters');
    });

    it('should return true for query exactly 1000 characters', () => {
      const query = 'a'.repeat(1000);
      expect(() => validateQueryValidator(query)).not.toThrow();
    });

    it('should trim whitespace before validation', () => {
      expect(() => validateQueryValidator('  hello world  ')).not.toThrow();
    });
  });

  describe('validateQueryEngineType', () => {
    it('should return true for default engine type', () => {
      expect(validateQueryEngineType('default')).toBe(true);
    });

    it('should return true for router engine type', () => {
      expect(validateQueryEngineType('router')).toBe(true);
    });

    it('should return true for subquestion engine type', () => {
      expect(validateQueryEngineType('subquestion')).toBe(true);
    });

    it('should return false for invalid engine type', () => {
      expect(validateQueryEngineType('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateQueryEngineType('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateQueryEngineType('Default')).toBe(false);
    });
  });

  describe('validateChatEngineType', () => {
    it('should return true for condense engine type', () => {
      expect(validateChatEngineType('condense')).toBe(true);
    });

    it('should return true for context engine type', () => {
      expect(validateChatEngineType('context')).toBe(true);
    });

    it('should return false for invalid engine type', () => {
      expect(validateChatEngineType('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateChatEngineType('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateChatEngineType('Condense')).toBe(false);
    });
  });

  describe('validateAgentType', () => {
    it('should return true for react agent type', () => {
      expect(validateAgentType('react')).toBe(true);
    });

    it('should return true for openai agent type', () => {
      expect(validateAgentType('openai')).toBe(true);
    });

    it('should return true for null agent type', () => {
      expect(validateAgentType(null)).toBe(true);
    });

    it('should return false for invalid agent type', () => {
      expect(validateAgentType('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateAgentType('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateAgentType('React')).toBe(false);
    });
  });

  describe('validateSessionKey', () => {
    it('should return true for null session key', () => {
      expect(validateSessionKey(null)).toBe(true);
    });

    it('should return true for valid session key', () => {
      expect(validateSessionKey('session-123')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(validateSessionKey('')).toBe(false);
    });

    it('should return true for whitespace only (non-empty string)', () => {
      expect(validateSessionKey('   ')).toBe(true);
    });

    it('should return true for single character', () => {
      expect(validateSessionKey('a')).toBe(true);
    });
  });
});
