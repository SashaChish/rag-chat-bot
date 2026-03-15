"use client";

import { useState, useEffect } from 'react';
import Upload from '@/components/Upload/Upload';
import type { DocumentUploadResponse, SupportedFormat } from '@/lib/types/api';

export default function UploadWrapper(): JSX.Element {
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSupportedFormats(): Promise<void> {
      try {
        const response = await fetch("/api/documents");
        if (response.ok) {
          const data = await response.json();
          const formatNames = (data.supportedFormats as SupportedFormat[]).map(f => f.type);
          setSupportedFormats(formatNames || []);
        }
      } catch (error) {
        console.error("Failed to fetch supported formats:", error);
        setSupportedFormats(["PDF", "TEXT", "MARKDOWN", "DOCX"]);
      }
    }
    fetchSupportedFormats();
  }, []);

  function handleUploadSuccess(data: DocumentUploadResponse): void {
    console.log("Document uploaded successfully:", data);
    window.dispatchEvent(new CustomEvent('documentUploaded', { detail: data }));
  }

  return <Upload onUploadSuccess={handleUploadSuccess} supportedFormats={supportedFormats} />;
}