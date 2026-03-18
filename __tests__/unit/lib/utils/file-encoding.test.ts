import { describe, it, expect } from 'vitest';
import { getFileExtension, getMimeType } from '@/lib/utils/file-encoding/encoding.utils';

describe('getFileExtension', () => {
  it('should return correct extension for files with extension', () => {
    expect(getFileExtension('test.pdf')).toBe('pdf');
    expect(getFileExtension('document.txt')).toBe('txt');
    expect(getFileExtension('notes.md')).toBe('md');
    expect(getFileExtension('report.docx')).toBe('docx');
  });

  it('should return the last segment for files without extension dot', () => {
    expect(getFileExtension('testfile')).toBe('testfile');
    expect(getFileExtension('README')).toBe('readme');
    expect(getFileExtension('no_extension')).toBe('no_extension');
  });

  it('should handle multiple dots in filename', () => {
    expect(getFileExtension('test.backup.txt')).toBe('txt');
    expect(getFileExtension('final.report.pdf')).toBe('pdf');
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });

  it('should handle uppercase extensions', () => {
    expect(getFileExtension('test.PDF')).toBe('pdf');
    expect(getFileExtension('document.TXT')).toBe('txt');
    expect(getFileExtension('notes.MD')).toBe('md');
  });

  it('should handle mixed case extensions', () => {
    expect(getFileExtension('test.PdF')).toBe('pdf');
    expect(getFileExtension('document.TxT')).toBe('txt');
    expect(getFileExtension('notes.Md')).toBe('md');
  });

  it('should handle files ending with dot', () => {
    expect(getFileExtension('testfile.')).toBe('');
  });

  it('should handle hidden files (dot prefix)', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
    expect(getFileExtension('.env.example')).toBe('example');
  });
});

describe('getMimeType', () => {
  it('should return correct MIME types for supported extensions', () => {
    expect(getMimeType('pdf')).toBe('application/pdf');
    expect(getMimeType('txt')).toBe('text/plain');
    expect(getMimeType('md')).toBe('text/markdown');
    expect(getMimeType('markdown')).toBe('text/markdown');
    expect(getMimeType('docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('should return default MIME type for unsupported extensions', () => {
    expect(getMimeType('jpg')).toBe('application/octet-stream');
    expect(getMimeType('png')).toBe('application/octet-stream');
    expect(getMimeType('exe')).toBe('application/octet-stream');
  });

  it('should return default MIME type for empty extension', () => {
    expect(getMimeType('')).toBe('application/octet-stream');
  });

  it('should handle case sensitive extensions', () => {
    expect(getMimeType('PDF')).toBe('application/octet-stream');
    expect(getMimeType('TXT')).toBe('application/octet-stream');
  });
});
