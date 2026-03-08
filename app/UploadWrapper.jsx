"use client";

/**
 * Upload Wrapper - Client Component
 * Wraps Upload component to handle client-side interactivity
 */

import Upload from "@/components/Upload";

export default function UploadWrapper() {
  function handleUploadSuccess(data) {
    console.log("Document uploaded successfully:", data);
    // Dispatch custom event to notify DocumentList to refresh
    window.dispatchEvent(new CustomEvent('documentUploaded', { detail: data }));
  }

  return <Upload onUploadSuccess={handleUploadSuccess} />;
}
