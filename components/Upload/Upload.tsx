'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { UploadIcon, ErrorIcon, SuccessIcon } from '@/lib/icons';
import type { UploadProps } from '../../lib/types/components';
import type { DocumentUploadResponse as APIUploadResponse } from '../../lib/types/api';
import {
  getSupportedExtensions,
} from './Upload.utils';

export default function Upload({ onUploadSuccess, supportedFormats }: UploadProps) {
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
    onMutate: () => {
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
    onSuccess: (data, _file, context) => {
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
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div
        className={cn(
          "border-2 border-dashed border-zinc-300 rounded-xl py-12 px-8 text-center cursor-pointer transition-all bg-zinc-50",
          !isUploading && "hover:border-primary-500 hover:bg-primary-50",
          isDragging && "border-primary-500 bg-primary-100 scale-[1.02]",
          isUploading && "cursor-not-allowed border-solid border-primary-500"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept={getSupportedExtensions(supportedFormats).map(f => `.${f}`).join(',')}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-[3px] border-zinc-200 border-t-primary-500 rounded-full animate-spin" />
            <p className="m-0">Uploading and indexing...</p>
            <div className="w-full h-2 bg-zinc-200 rounded overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadIcon className="w-12 h-12 mb-4" />
            <h3 className="m-0 mb-2 text-zinc-900">Upload a Document</h3>
            <p className="m-0 mb-1 text-zinc-500">
              Drag and drop a file here, or click to browse
            </p>
            <p className="text-sm text-zinc-400">
              Supported formats: {supportedFormats && supportedFormats.length > 0
                ? supportedFormats.join(', ')
                : 'PDF, TEXT, MARKDOWN, DOCX'} (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 mt-4 py-3 px-4 rounded-lg text-sm bg-danger-50 text-danger-800 border border-danger-200"
          data-testid="upload-error"
        >
          <ErrorIcon />
          {error}
        </div>
      )}

      {success && (
        <div
          className="flex items-center gap-2 mt-4 py-3 px-4 rounded-lg text-sm bg-success-50 text-success-600 border border-green-200"
          data-testid="upload-success"
        >
          <SuccessIcon />
          {success.message}
          {success.chunksProcessed && (
            <span className="text-zinc-600">
              ({success.chunksProcessed} chunks processed)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
