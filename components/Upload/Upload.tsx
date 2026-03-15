'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './Upload.module.css';
import type { UploadProps } from '../../lib/types/components';
import type { DocumentUploadResponse as APIUploadResponse } from '../../lib/types/api';
import {
  getSupportedExtensions,
} from './Upload.utils';

export default function Upload({ onUploadSuccess, supportedFormats }: UploadProps): JSX.Element {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; filename: string; chunksProcessed?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: async (file: File): Promise<APIUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onMutate: (file) => {
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return { progressInterval };
    },
    onSuccess: (data, file, context) => {
      if (context?.progressInterval) {
        clearInterval(context.progressInterval);
      }
      setUploadProgress(100);

      setSuccess({
        message: data.message,
        filename: data.filename,
        chunksProcessed: data.chunksProcessed,
      });

      setTimeout(() => setSuccess(null), 3000);

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }

      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });

      window.dispatchEvent(new CustomEvent('documentUploaded', { detail: data }));
    },
    onError: (error) => {
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    },
    onSettled: () => {
      setUploadProgress(0);
    },
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File): void => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const formatsToCheck = getSupportedExtensions(supportedFormats);

    if (!formatsToCheck.includes(ext)) {
      setError(
        `Unsupported file format. Supported formats: ${supportedFormats && supportedFormats.length > 0
          ? supportedFormats.join(', ')
          : 'PDF, TEXT, MARKDOWN, DOCX'}`
      );
      setTimeout(() => setError(null), 5000);
      return;
    }

    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(
        `File size exceeds ${maxSizeMB}MB limit. Your file is ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
      setTimeout(() => setError(null), 5000);
      return;
    }

    uploadFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.uploadContainer}>
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${
          isUploading ? styles.uploading : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className={styles.fileInput}
          accept={getSupportedExtensions(supportedFormats).map(f => `.${f}`).join(',')}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className={styles.uploadProgress}>
            <div className={styles.progressSpinner} />
            <p>Uploading and indexing...</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.uploadIcon}>📄</div>
            <h3>Upload a Document</h3>
            <p>
              Drag and drop a file here, or click to browse
            </p>
            <p className={styles.uploadHint}>
              Supported formats: {supportedFormats && supportedFormats.length > 0
                ? supportedFormats.join(', ')
                : 'PDF, TEXT, MARKDOWN, DOCX'} (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className={`${styles.uploadMessage} ${styles.uploadError}`}>
          <span className={styles.messageIcon}>❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className={`${styles.uploadMessage} ${styles.uploadSuccess}`}>
          <span className={styles.messageIcon}>✅</span>
          {success.message}
          {success.chunksProcessed && (
            <span className={styles.chunksInfo}>
              ({success.chunksProcessed} chunks processed)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
