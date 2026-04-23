import { describe, it, expect } from 'vitest';
import {
  formatContent,
  getSourceExplanation,
  getSimilarityColor,
  getSimilarityPercentage,
  isValidScore,
} from '@/components/MessageList/MessageList.utils';

describe('formatContent', () => {
  it('should return empty string for empty content', () => {
    expect(formatContent('')).toBe('');
  });

  it('should convert bold markdown to HTML', () => {
    expect(formatContent('This is **bold** text')).toBe('This is <strong>bold</strong> text');
    expect(formatContent('**All bold**')).toBe('<strong>All bold</strong>');
  });

  it('should convert italic markdown to HTML', () => {
    expect(formatContent('This is *italic* text')).toBe('This is <em>italic</em> text');
    expect(formatContent('*All italic*')).toBe('<em>All italic</em>');
  });

  it('should convert code blocks to HTML', () => {
    expect(formatContent('Here is code:\n```const x = 1;```')).toBe(
      'Here is code:<br><pre><code>const x = 1;</code></pre>'
    );
  });

  it('should convert inline code to HTML', () => {
    expect(formatContent('Use `code` here')).toBe('Use <code>code</code> here');
  });

  it('should convert line breaks to HTML', () => {
    expect(formatContent('Line 1\nLine 2\nLine 3')).toBe('Line 1<br>Line 2<br>Line 3');
  });

  it('should handle multiple markdown formats in one string', () => {
    expect(formatContent('**Bold** and *italic* with `code`')).toBe(
      '<strong>Bold</strong> and <em>italic</em> with <code>code</code>'
    );
  });

  it('should handle nested markdown', () => {
    expect(formatContent('**Bold with *italic* inside**')).toBe(
      '<strong>Bold with <em>italic</em> inside</strong>'
    );
  });
});

describe('getSourceExplanation', () => {
  it('should return null for undefined sources', () => {
    expect(getSourceExplanation(undefined)).toBe(null);
  });

  it('should return null for empty sources array', () => {
    expect(getSourceExplanation([])).toBe(null);
  });

  it('should return explanation for single source with multiple chunks', () => {
    const sources = [
      { filename: 'test.txt', fileType: 'txt', score: 0.9, text: '...' },
      { filename: 'test.txt', fileType: 'txt', score: 0.8, text: '...' },
    ];

    const result = getSourceExplanation(sources);

    expect(result).not.toBeNull();
    expect(result?.text).toContain('2 chunks');
    expect(result?.text).toContain('test.txt');
    expect(result?.chunks).toBe(2);
    expect(result?.documents).toBe(1);
  });

  it('should return explanation for single source with single chunk', () => {
    const sources = [{ filename: 'test.txt', fileType: 'txt', score: 0.9, text: '...' }];

    const result = getSourceExplanation(sources);

    expect(result).not.toBeNull();
    expect(result?.text).toContain('1 chunk');
    expect(result?.text).not.toContain('chunks');
    expect(result?.chunks).toBe(1);
    expect(result?.documents).toBe(1);
  });

  it('should return explanation for multiple sources', () => {
    const sources = [
      { filename: 'test1.txt', fileType: 'txt', score: 0.9, text: '...' },
      { filename: 'test2.txt', fileType: 'txt', score: 0.8, text: '...' },
    ];

    const result = getSourceExplanation(sources);

    expect(result).not.toBeNull();
    expect(result?.text).toContain('2 document');
    expect(result?.documents).toBe(2);
    expect(result?.chunks).toBe(2);
  });

  it('should deduplicate filenames across sources', () => {
    const sources = [
      { filename: 'test.txt', fileType: 'txt', score: 0.9, text: '...' },
      { filename: 'test.txt', fileType: 'txt', score: 0.8, text: '...' },
      { filename: 'test.txt', fileType: 'txt', score: 0.7, text: '...' },
    ];

    const result = getSourceExplanation(sources);

    expect(result?.documents).toBe(1);
    expect(result?.chunks).toBe(3);
  });
});

describe('getSimilarityColor', () => {
  it('should return green for high scores (>= 0.7)', () => {
    expect(getSimilarityColor(0.7)).toBe('green');
    expect(getSimilarityColor(0.8)).toBe('green');
    expect(getSimilarityColor(1.0)).toBe('green');
  });

  it('should return yellow/orange for medium scores (>= 0.4)', () => {
    expect(getSimilarityColor(0.4)).toBe('amber');
    expect(getSimilarityColor(0.5)).toBe('amber');
    expect(getSimilarityColor(0.6)).toBe('amber');
  });

  it('should return gray for low scores (< 0.4)', () => {
    expect(getSimilarityColor(0.0)).toBe('gray');
    expect(getSimilarityColor(0.1)).toBe('gray');
    expect(getSimilarityColor(0.39)).toBe('gray');
  });

  it('should handle edge cases', () => {
    expect(getSimilarityColor(0)).toBe('gray');
    expect(getSimilarityColor(0.399)).toBe('gray');
    expect(getSimilarityColor(0.4)).toBe('amber');
    expect(getSimilarityColor(0.7)).toBe('green');
  });
});

describe('getSimilarityPercentage', () => {
  it('should convert numeric score to percentage', () => {
    expect(getSimilarityPercentage(0.5)).toBe(50);
    expect(getSimilarityPercentage(0.75)).toBe(75);
    expect(getSimilarityPercentage(1.0)).toBe(100);
  });

  it('should convert string score to percentage', () => {
    expect(getSimilarityPercentage('0.5')).toBe(50);
    expect(getSimilarityPercentage('0.75')).toBe(75);
    expect(getSimilarityPercentage('1.0')).toBe(100);
  });

  it('should return 0 for invalid scores', () => {
    expect(getSimilarityPercentage(NaN)).toBe(0);
  });

  it('should return 0 for invalid string scores', () => {
    expect(getSimilarityPercentage('invalid')).toBe(0);
    expect(getSimilarityPercentage('')).toBe(0);
  });

  it('should round to nearest integer', () => {
    expect(getSimilarityPercentage(0.123)).toBe(12);
    expect(getSimilarityPercentage(0.567)).toBe(57);
    expect(getSimilarityPercentage(0.999)).toBe(100);
  });
});

describe('isValidScore', () => {
  it('should return true for valid numeric scores', () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(0.5)).toBe(true);
    expect(isValidScore(1.0)).toBe(true);
  });

  it('should return true for valid string scores', () => {
    expect(isValidScore('0')).toBe(true);
    expect(isValidScore('0.5')).toBe(true);
    expect(isValidScore('1.0')).toBe(true);
  });

  it('should return false for NaN', () => {
    expect(isValidScore(NaN)).toBe(false);
  });

  it('should return false for invalid string scores', () => {
    expect(isValidScore('invalid')).toBe(false);
    expect(isValidScore('')).toBe(false);
    expect(isValidScore('abc')).toBe(false);
  });
});
