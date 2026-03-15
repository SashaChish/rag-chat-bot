/**
 * Upload Component Types
 * Type definitions specific to the Upload component
 */

import type { DocumentUploadResponse } from '@/lib/types/api';

/**
 * Upload component state interface
 */
export interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  success: {
    message: string;
    filename: string;
    chunksProcessed?: number;
  } | null;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  message: string;
  filename: string;
  chunksProcessed?: number;
}
