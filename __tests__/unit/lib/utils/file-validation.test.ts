import { describe, it, expect } from 'vitest';
import { validateFileSize } from '@/lib/utils/file-validation/validation.utils';
import { validateFileExtension } from '@/components/Upload/Upload.utils';
import { getFileType } from '@/lib/llamaindex/loaders';

describe('validateFileSize', () => {
  it('should return valid for file size within limit', () => {
    const result = validateFileSize(1024, 10);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should return valid for file size exactly at limit', () => {
    const maxSizeBytes = 10 * 1024 * 1024;
    const result = validateFileSize(maxSizeBytes, 10);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should return invalid for empty file', () => {
    const result = validateFileSize(0, 10);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('File is empty');
  });

  it('should return invalid for file size exceeding limit', () => {
    const result = validateFileSize(11 * 1024 * 1024, 10);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('exceeds maximum allowed size');
    expect(result.message).toContain('11.00MB');
    expect(result.message).toContain('10MB');
  });

  it('should format file size correctly in error message', () => {
    const result = validateFileSize(15.5 * 1024 * 1024, 10);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('15.50MB');
  });

  it('should handle small file sizes', () => {
    const result = validateFileSize(100, 1);
    expect(result.valid).toBe(true);
  });

  it('should handle large max size values', () => {
    const result = validateFileSize(5 * 1024 * 1024, 100);
    expect(result.valid).toBe(true);
  });
});

describe('validateFileExtension (from Upload.utils)', () => {
  it('should return valid for supported extensions', () => {
    expect(validateFileExtension('test.pdf')).toBe(true);
    expect(validateFileExtension('test.txt')).toBe(true);
    expect(validateFileExtension('test.md')).toBe(true);
    expect(validateFileExtension('test.markdown')).toBe(true);
    expect(validateFileExtension('test.docx')).toBe(true);
  });

  it('should return invalid for unsupported extensions', () => {
    expect(validateFileExtension('test.jpg')).toBe(false);
    expect(validateFileExtension('test.png')).toBe(false);
    expect(validateFileExtension('test.exe')).toBe(false);
  });

  it('should handle case insensitive extensions', () => {
    expect(validateFileExtension('test.PDF')).toBe(true);
    expect(validateFileExtension('test.Txt')).toBe(true);
    expect(validateFileExtension('test.DOCX')).toBe(true);
  });

  it('should handle files with no extension', () => {
    expect(validateFileExtension('testfile')).toBe(false);
  });

  it('should handle files with multiple dots', () => {
    expect(validateFileExtension('test.backup.txt')).toBe(true);
    expect(validateFileExtension('test.final.pdf')).toBe(true);
  });
});

describe('getFileType (from loaders)', () => {
  it('should return correct file type for supported extensions', () => {
    expect(getFileType('test.pdf')).toBe('PDF');
    expect(getFileType('test.txt')).toBe('TEXT');
    expect(getFileType('test.md')).toBe('MARKDOWN');
    expect(getFileType('test.markdown')).toBe('MARKDOWN');
    expect(getFileType('test.docx')).toBe('DOCX');
  });

  it('should return null for unsupported extensions', () => {
    expect(getFileType('test.jpg')).toBe(null);
    expect(getFileType('test.png')).toBe(null);
    expect(getFileType('test.exe')).toBe(null);
  });

  it('should return null for files with no extension', () => {
    expect(getFileType('testfile')).toBe(null);
  });

  it('should handle case insensitive extensions', () => {
    expect(getFileType('test.PDF')).toBe('PDF');
    expect(getFileType('test.TXT')).toBe('TEXT');
    expect(getFileType('test.DOCX')).toBe('DOCX');
  });
});
