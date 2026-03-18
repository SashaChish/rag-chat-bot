import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFileSize,
  validateFileType,
  validateFileExtension,
  validateFilename,
  validateFileUpload,
} from '@/lib/validators/file.validators';

describe('File Validators', () => {
  describe('validateFileSize', () => {
    it('should return true for file within size limit', () => {
      const content = 'a'.repeat(1024 * 1024);
      const file = new File([content], 'test.txt');
      expect(() => validateFileSize(file, 10)).not.toThrow();
    });

    it('should throw error for file exceeding default 10MB limit', () => {
      const content = 'a'.repeat(11 * 1024 * 1024);
      const file = new File([content], 'test.txt');
      expect(() => validateFileSize(file)).toThrow('File size exceeds 10MB limit');
    });

    it('should throw error for file exceeding custom size limit', () => {
      const content = 'a'.repeat(6 * 1024 * 1024);
      const file = new File([content], 'test.txt');
      expect(() => validateFileSize(file, 5)).toThrow('File size exceeds 5MB limit');
    });

    it('should return true for zero byte file', () => {
      const file = new File([''], 'test.txt');
      expect(() => validateFileSize(file)).not.toThrow();
    });

    it('should return true for file exactly at size limit', () => {
      const content = 'a'.repeat(10 * 1024 * 1024);
      const file = new File([content], 'test.txt');
      expect(() => validateFileSize(file, 10)).not.toThrow();
    });
  });

  describe('validateFileType', () => {
    it('should return true for allowed type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(() => validateFileType(file, ['text/plain'])).not.toThrow();
    });

    it('should throw error for disallowed type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateFileType(file, ['text/plain'])).toThrow(
        'Unsupported file type: application/pdf'
      );
    });

    it('should accept multiple allowed types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateFileType(file, ['text/plain', 'application/pdf'])).not.toThrow();
    });

    it('should throw error for empty allowed types array', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(() => validateFileType(file, [])).toThrow('Unsupported file type: text/plain');
    });
  });

  describe('validateFileExtension', () => {
    it('should return true for allowed extension', () => {
      expect(() => validateFileExtension('test.txt', ['txt', 'pdf'])).not.toThrow();
    });

    it('should throw error for disallowed extension', () => {
      expect(() => validateFileExtension('test.exe', ['txt', 'pdf'])).toThrow(
        'Unsupported file extension: exe'
      );
    });

    it('should handle uppercase extension', () => {
      expect(() => validateFileExtension('test.TXT', ['txt'])).not.toThrow();
    });

    it('should handle multiple dots in filename', () => {
      expect(() => validateFileExtension('test.backup.txt', ['txt'])).not.toThrow();
    });

    it('should handle filename without extension', () => {
      expect(() => validateFileExtension('testfile', ['txt'])).toThrow(
        'Unsupported file extension: '
      );
    });
  });

  describe('validateFilename', () => {
    it('should return true for valid filename', () => {
      expect(() => validateFilename('test.txt')).not.toThrow();
    });

    it('should throw error for empty filename', () => {
      expect(() => validateFilename('')).toThrow('Filename cannot be empty');
    });

    it('should throw error for whitespace only filename', () => {
      expect(() => validateFilename('   ')).toThrow('Filename cannot be empty');
    });

    it('should throw error for filename exceeding 255 characters', () => {
      const longName = 'a'.repeat(256);
      expect(() => validateFilename(longName)).toThrow('Filename cannot exceed 255 characters');
    });

    it('should return true for filename exactly 255 characters', () => {
      const longName = 'a'.repeat(255);
      expect(() => validateFilename(longName)).not.toThrow();
    });

    it('should throw error for filename with invalid characters', () => {
      const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
      invalidChars.forEach(char => {
        expect(() => validateFilename(`test${char}file.txt`)).toThrow(
          'Filename contains invalid characters'
        );
      });
    });

    it('should throw error for Windows reserved name CON', () => {
      expect(() => validateFilename('CON.txt')).toThrow('Filename is a reserved system name');
    });

    it('should throw error for Windows reserved name PRN', () => {
      expect(() => validateFilename('PRN.txt')).toThrow('Filename is a reserved system name');
    });

    it('should throw error for Windows reserved name AUX', () => {
      expect(() => validateFilename('AUX.txt')).toThrow('Filename is a reserved system name');
    });

    it('should throw error for Windows reserved name NUL', () => {
      expect(() => validateFilename('NUL.txt')).toThrow('Filename is a reserved system name');
    });

    it('should throw error for COM1 reserved name', () => {
      expect(() => validateFilename('COM1.txt')).toThrow('Filename is a reserved system name');
    });

    it('should throw error for LPT1 reserved name', () => {
      expect(() => validateFilename('LPT1.txt')).toThrow('Filename is a reserved system name');
    });

    it('should handle uppercase reserved names', () => {
      expect(() => validateFilename('con.txt')).toThrow('Filename is a reserved system name');
    });

    it('should return true for filename with valid special characters', () => {
      expect(() => validateFilename('test-file_123.txt')).not.toThrow();
    });
  });

  describe('validateFileUpload', () => {
    let mockFile: File;
    let smallContent: string;
    let largeContent: string;

    beforeEach(() => {
      smallContent = 'test content';
      largeContent = 'a'.repeat(11 * 1024 * 1024);
      mockFile = new File([smallContent], 'test.txt', { type: 'text/plain' });
    });

    it('should validate with no options', () => {
      expect(() => validateFileUpload(mockFile)).not.toThrow();
    });

    it('should validate with custom max size', () => {
      const mediumFile = new File(['a'.repeat(6 * 1024 * 1024)], 'test.txt', { type: 'text/plain' });
      expect(() => validateFileUpload(mediumFile, { maxSizeMB: 10 })).not.toThrow();
    });

    it('should validate with allowed types', () => {
      expect(() => validateFileUpload(mockFile, { allowedTypes: ['text/plain'] })).not.toThrow();
    });

    it('should validate with allowed extensions', () => {
      expect(() => validateFileUpload(mockFile, { allowedExtensions: ['txt'] })).not.toThrow();
    });

    it('should validate with all options', () => {
      const mediumFile = new File(['a'.repeat(6 * 1024 * 1024)], 'test.txt', { type: 'text/plain' });
      expect(() =>
        validateFileUpload(mediumFile, {
          maxSizeMB: 10,
          allowedTypes: ['text/plain'],
          allowedExtensions: ['txt'],
        })
      ).not.toThrow();
    });

    it('should throw error on filename validation failure', () => {
      const invalidFile = new File([''], '', { type: 'text/plain' });
      expect(() => validateFileUpload(invalidFile)).toThrow('Filename cannot be empty');
    });

    it('should throw error on size validation failure', () => {
      const largeFile = new File([largeContent], 'test.txt', { type: 'text/plain' });
      expect(() =>
        validateFileUpload(largeFile, { maxSizeMB: 10 })
      ).toThrow('File size exceeds 10MB limit');
    });

    it('should throw error on type validation failure', () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(() =>
        validateFileUpload(pdfFile, { allowedTypes: ['text/plain'] })
      ).toThrow('Unsupported file type');
    });

    it('should throw error on extension validation failure', () => {
      expect(() =>
        validateFileUpload(mockFile, { allowedExtensions: ['pdf'] })
      ).toThrow('Unsupported file extension');
    });
  });
});
