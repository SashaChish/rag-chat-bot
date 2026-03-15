"use client";

import Upload from "@/components/Upload";
import type { DocumentUploadResponse } from "@/lib/types/api";

export default function UploadWrapper(): JSX.Element {
  function handleUploadSuccess(data: DocumentUploadResponse): void {
    console.log("Document uploaded successfully:", data);
    window.dispatchEvent(new CustomEvent('documentUploaded', { detail: data }));
  }

  return <Upload onUploadSuccess={handleUploadSuccess} supportedFormats={undefined} />;
}