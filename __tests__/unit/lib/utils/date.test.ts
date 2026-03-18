import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateTime, getRelativeTime } from '@/lib/utils/date.utils';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should format date with different months', () => {
      const january = formatDate('2024-01-15T10:30:00Z');
      const june = formatDate('2024-06-15T10:30:00Z');
      const december = formatDate('2024-12-15T10:30:00Z');

      expect(january).toContain('Jan');
      expect(june).toContain('Jun');
      expect(december).toContain('Dec');
    });
  });

  describe('formatDateTime', () => {
    it('should format date time string correctly', () => {
      const result = formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toMatch(/:\d{2}/);
    });

    it('should include time components', () => {
      const result = formatDateTime('2024-01-15T14:30:45Z');
      const timeMatch = result.match(/(\d{1,2}):(\d{2})/);
      expect(timeMatch).toBeTruthy();
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for less than a minute ago', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:29:30Z');
      expect(result).toBe('just now');
    });

    it('should return "1 minute ago" for exactly one minute', () => {
      vi.setSystemTime(new Date('2024-01-15T10:31:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('1 minute ago');
    });

    it('should return "X minutes ago" for less than an hour', () => {
      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('30 minutes ago');
    });

    it('should use plural for multiple minutes', () => {
      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
      const result = getRelativeTime('2024-01-15T10:25:00Z');
      expect(result).toBe('35 minutes ago');
    });

    it('should return "1 hour ago" for exactly one hour', () => {
      vi.setSystemTime(new Date('2024-01-15T11:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('1 hour ago');
    });

    it('should return "X hours ago" for less than a day', () => {
      vi.setSystemTime(new Date('2024-01-15T16:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('6 hours ago');
    });

    it('should use plural for multiple hours', () => {
      vi.setSystemTime(new Date('2024-01-15T18:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('8 hours ago');
    });

    it('should return "1 day ago" for exactly one day', () => {
      vi.setSystemTime(new Date('2024-01-16T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('1 day ago');
    });

    it('should return "X days ago" for less than a week', () => {
      vi.setSystemTime(new Date('2024-01-17T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('2 days ago');
    });

    it('should use plural for multiple days', () => {
      vi.setSystemTime(new Date('2024-01-19T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toBe('4 days ago');
    });

    it('should return formatted date for dates older than a week', () => {
      vi.setSystemTime(new Date('2024-01-25T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });

    it('should return formatted date for exactly 7 days old', () => {
      vi.setSystemTime(new Date('2024-01-22T10:30:00Z'));
      const result = getRelativeTime('2024-01-15T10:30:00Z');
      expect(result).toContain('2024');
    });
  });
});
