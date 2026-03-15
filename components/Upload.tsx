"use client";

import { useState, useRef } from "react";
import styles from "./Upload.module.css";
import type { UploadProps } from "@/lib/types/components";

export default function Upload({ onUploadSuccess, supportedFormats }: UploadProps): JSX.Element {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; filename: string; chunksProcessed?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (file: File): Promise<void> => {
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const supportedExtensions = [
        "pdf",
        "txt",
        "md",
        "markdown",
        "docx",
      ];

      if (!supportedExtensions.includes(ext)) {
        throw new Error(
          `Unsupported file format. Supported formats: ${supportedExtensions.join(
            ", "
          )}`
        );
      }

      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(
          `File size exceeds ${maxSizeMB}MB limit. Your file is ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess({
        message: data.message,
        filename: data.filename,
        chunksProcessed: data.chunksProcessed,
      });

      setTimeout(() => setSuccess(null), 3000);

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={styles.uploadContainer}>
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ""} ${
          isUploading ? styles.uploading : ""
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
          accept=".pdf,.txt,.md,.markdown,.docx"
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
              Supported formats: PDF, TXT, MD, DOCX (max 10MB)
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