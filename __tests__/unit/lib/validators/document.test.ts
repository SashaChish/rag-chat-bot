import { describe, it, expect } from 'vitest';
import {
  validateDocumentId,
  validateDocumentMetadata,
  validateChunkCount,
  validateDocumentUrl,
} from '@/lib/validators/document.validators';

describe('Document Validators', () => {
  describe('validateDocumentId', () => {
    it('should return true for valid document ID', () => {
      expect(() => validateDocumentId('doc-123')).not.toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => validateDocumentId('')).toThrow('Document ID must be a non-empty string');
    });

    it('should throw error for whitespace only', () => {
      expect(() => validateDocumentId('   ')).toThrow('Document ID cannot be empty or whitespace');
    });

    it('should handle ID with special characters', () => {
      expect(() => validateDocumentId('doc_123-456')).not.toThrow();
    });
  });

  describe('validateDocumentMetadata', () => {
    it('should return true for valid metadata', () => {
      const metadata = {
        file_name: 'test.txt',
        file_type: 'text/plain',
        upload_date: '2024-01-15T10:30:00Z',
      };
      expect(() => validateDocumentMetadata(metadata)).not.toThrow();
    });

    it('should throw error for missing file_name', () => {
      const metadata = {
        file_name: '',
        file_type: 'text/plain',
        upload_date: '2024-01-15T10:30:00Z',
      };
      expect(() => validateDocumentMetadata(metadata)).toThrow('Document must have a valid file name');
    });

    it('should throw error for missing file_type', () => {
      const metadata = {
        file_name: 'test.txt',
        file_type: '',
        upload_date: '2024-01-15T10:30:00Z',
      };
      expect(() => validateDocumentMetadata(metadata)).toThrow('Document must have a valid file type');
    });

    it('should throw error for missing upload_date', () => {
      const metadata = {
        file_name: 'test.txt',
        file_type: 'text/plain',
        upload_date: '',
      };
      expect(() => validateDocumentMetadata(metadata)).toThrow('Document must have a valid upload date');
    });

    it('should throw error for invalid date string', () => {
      const metadata = {
        file_name: 'test.txt',
        file_type: 'text/plain',
        upload_date: 'invalid-date',
      };
      expect(() => validateDocumentMetadata(metadata)).toThrow('Document upload date must be a valid date string');
    });

    it('should handle valid date formats', () => {
      const validDates = [
        '2024-01-15T10:30:00Z',
        '2024-01-15',
        '2024/01/15',
        new Date().toISOString(),
      ];
      validDates.forEach(date => {
        const metadata = {
          file_name: 'test.txt',
          file_type: 'text/plain',
          upload_date: date,
        };
        expect(() => validateDocumentMetadata(metadata)).not.toThrow();
      });
    });
  });

  describe('validateChunkCount', () => {
    it('should return true for valid chunk count', () => {
      expect(() => validateChunkCount(100)).not.toThrow();
    });

    it('should return true for zero', () => {
      expect(() => validateChunkCount(0)).not.toThrow();
    });

    it('should throw error for negative number', () => {
      expect(() => validateChunkCount(-1)).toThrow('Chunk count cannot be negative');
    });

    it('should throw error for decimal number', () => {
      expect(() => validateChunkCount(1.5)).toThrow('Chunk count must be an integer');
    });

    it('should throw error for number larger than 100000', () => {
      expect(() => validateChunkCount(100001)).toThrow('Chunk count exceeds maximum allowed value');
    });

    it('should return true for exactly 100000', () => {
      expect(() => validateChunkCount(100000)).not.toThrow();
    });

    it('should handle large valid numbers', () => {
      expect(() => validateChunkCount(99999)).not.toThrow();
    });
  });

  describe('validateDocumentUrl', () => {
    it('should return true for null URL', () => {
      expect(() => validateDocumentUrl(null)).not.toThrow();
    });

    it('should return true for valid http URL', () => {
      expect(() => validateDocumentUrl('http://example.com')).not.toThrow();
    });

    it('should return true for valid https URL', () => {
      expect(() => validateDocumentUrl('https://example.com')).not.toThrow();
    });

    it('should throw error for invalid URL', () => {
      expect(() => validateDocumentUrl('not-a-url')).toThrow('Invalid document URL format');
    });

    it('should throw error for URL without protocol', () => {
      expect(() => validateDocumentUrl('example.com')).toThrow('Invalid document URL format');
    });

    it('should throw error for malformed URL', () => {
      expect(() => validateDocumentUrl('http://')).toThrow('Invalid document URL format');
    });

    it('should handle URL with path', () => {
      expect(() => validateDocumentUrl('https://example.com/path/to/document')).not.toThrow();
    });

    it('should handle URL with query parameters', () => {
      expect(() => validateDocumentUrl('https://example.com?param=value')).not.toThrow();
    });

    it('should handle URL with port', () => {
      expect(() => validateDocumentUrl('https://example.com:8080')).not.toThrow();
    });
  });
});
