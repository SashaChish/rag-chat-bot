/**
 * Upload Component
 * File upload interface with progress tracking and error handling
 */

"use client";

import { useState, useRef } from "react";
import styles from "./Upload.module.css";

export default function Upload({ onUploadSuccess, supportedFormats }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Reset states
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setIsUploading(true);

    try {
      // Validate file
      const ext = file.name.split(".").pop().toLowerCase();
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

      // Check file size (max 10MB)
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

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file
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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setError(err.message);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
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
