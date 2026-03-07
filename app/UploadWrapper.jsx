"use client";

/**
 * Upload Wrapper - Client Component
 * Wraps Upload component to handle client-side interactivity
 */

import Upload from "@/components/Upload";

export default function UploadWrapper() {
  function handleUploadSuccess(data) {
    console.log("Document uploaded successfully:", data);
    // The document list will auto-refresh via its useEffect
  }

  return <Upload onUploadSuccess={handleUploadSuccess} />;
}
