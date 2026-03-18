import { describe, it, expect } from 'vitest';
import {
  truncateString,
  capitalizeFirst,
  camelToKebab,
  kebabToCamel,
  generateSlug,
  countWords,
  countChars,
} from '@/lib/utils/string.utils';

describe('String Utils', () => {
  describe('truncateString', () => {
    it('should return empty string for empty input', () => {
      const result = truncateString('');
      expect(result).toBe('');
    });

    it('should return string unchanged if shorter than max length', () => {
      const result = truncateString('short');
      expect(result).toBe('short');
    });

    it('should truncate string at max length', () => {
      const result = truncateString('a'.repeat(150), 100);
      expect(result.length).toBe(103); // 100 + '...'
    });

    it('should add ellipsis to truncated string', () => {
      const result = truncateString('very long string that needs truncation', 20);
      expect(result).toContain('...');
    });

    it('should use default max length of 100', () => {
      const longString = 'a'.repeat(150);
      const result = truncateString(longString);
      expect(result.length).toBe(103);
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      const result = capitalizeFirst('hello');
      expect(result).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
      const result = capitalizeFirst('');
      expect(result).toBe('');
    });

    it('should not change already capitalized string', () => {
      const result = capitalizeFirst('Hello');
      expect(result).toBe('Hello');
    });

    it('should work with single character', () => {
      const result = capitalizeFirst('a');
      expect(result).toBe('A');
    });
  });

  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      const result = camelToKebab('helloWorld');
      expect(result).toBe('hello-world');
    });

    it('should handle multiple uppercase letters', () => {
      const result = camelToKebab('myVariableName');
      expect(result).toBe('my-variable-name');
    });

    it('should handle numbers', () => {
      const result = camelToKebab('test123Value');
      expect(result).toBe('test123-value');
    });

    it('should handle single word', () => {
      const result = camelToKebab('hello');
      expect(result).toBe('hello');
    });

    it('should convert entire string to lowercase', () => {
      const result = camelToKebab('HelloWorld');
      expect(result).toBe('hello-world');
    });
  });

  describe('kebabToCamel', () => {
    it('should convert kebab-case to camelCase', () => {
      const result = kebabToCamel('hello-world');
      expect(result).toBe('helloWorld');
    });

    it('should handle multiple hyphens', () => {
      const result = kebabToCamel('my-variable-name');
      expect(result).toBe('myVariableName');
    });

    it('should handle numbers', () => {
      const result = kebabToCamel('test-123-value');
      expect(result).toBe('test123Value');
    });

    it('should handle single word', () => {
      const result = kebabToCamel('hello');
      expect(result).toBe('hello');
    });

    it('should capitalize letter after hyphen', () => {
      const result = kebabToCamel('test-string');
      expect(result).toBe('testString');
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      const result = generateSlug('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = generateSlug('hello world');
      expect(result).toBe('hello-world');
    });

    it('should remove special characters without adding hyphens', () => {
      const result = generateSlug('hello@world!');
      expect(result).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      const result = generateSlug('  hello world  ');
      expect(result).toBe('hello-world');
    });

    it('should handle multiple consecutive spaces', () => {
      const result = generateSlug('hello   world');
      expect(result).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      const result = generateSlug('--hello-world--');
      expect(result).toBe('hello-world');
    });

    it('should replace underscores with hyphens', () => {
      const result = generateSlug('hello_world');
      expect(result).toBe('hello-world');
    });

    it('should handle empty string', () => {
      const result = generateSlug('');
      expect(result).toBe('');
    });

    it('should handle mixed separators', () => {
      const result = generateSlug('hello _ world - test');
      expect(result).toBe('hello-world-test');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const result = countWords('hello world');
      expect(result).toBe(2);
    });

    it('should handle multiple spaces', () => {
      const result = countWords('hello   world');
      expect(result).toBe(2);
    });

    it('should handle empty string', () => {
      const result = countWords('');
      expect(result).toBe(0);
    });

    it('should trim whitespace before counting', () => {
      const result = countWords('  hello world  ');
      expect(result).toBe(2);
    });

    it('should handle single word', () => {
      const result = countWords('hello');
      expect(result).toBe(1);
    });

    it('should handle multiple words', () => {
      const result = countWords('one two three four five');
      expect(result).toBe(5);
    });

    it('should handle newlines', () => {
      const result = countWords('hello\nworld');
      expect(result).toBe(2);
    });

    it('should handle tabs', () => {
      const result = countWords('hello\tworld');
      expect(result).toBe(2);
    });
  });

  describe('countChars', () => {
    it('should count characters excluding spaces', () => {
      const result = countChars('hello world');
      expect(result).toBe(10);
    });

    it('should handle multiple spaces', () => {
      const result = countChars('hello   world');
      expect(result).toBe(10);
    });

    it('should handle empty string', () => {
      const result = countChars('');
      expect(result).toBe(0);
    });

    it('should count only letters and numbers', () => {
      const result = countChars('a b c 1 2 3');
      expect(result).toBe(6);
    });

    it('should handle tabs', () => {
      const result = countChars('hello\tworld');
      expect(result).toBe(10);
    });

    it('should handle newlines', () => {
      const result = countChars('hello\nworld');
      expect(result).toBe(10);
    });
  });
});
