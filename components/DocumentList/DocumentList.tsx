'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { ConfirmModal, ContentModal } from '../ui/Modal';
import {
  RefreshIcon,
  WarningIcon,
  StatsIcon,
  StorageIcon,
  EmptyStateIcon,
  InfoIcon,
  PreviewIcon,
  DownloadIcon,
  DeleteIcon,
} from '@/lib/icons';
import type {
  DocumentData,
  SupportedFormat,
} from './DocumentList.types';
import {
  getFileIcon,
  formatDocumentDate,
} from './DocumentList.utils';
import { useDocumentStats } from '@/lib/hooks/use-document-stats';
import { useDocumentList } from '@/lib/hooks/use-document-list';
import { useDocumentPreview } from '@/lib/hooks/use-document-preview';
import { useDocumentDelete } from '@/lib/hooks/use-document-delete';
import { useDocumentDownload } from '@/lib/hooks/use-document-download';

export default function DocumentList(): JSX.Element {
  const queryClient = useQueryClient();
  const { mutate: downloadDoc } = useDocumentDownload();

  const { data: statsData, isLoading, error: statsError, refetch } = useDocumentStats();
  const { data: documentsData, isFetching, error: documentsError, refetch: refetchDocuments } = useDocumentList();
  const { mutate: deleteDoc } = useDocumentDelete();
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const { data: previewData, isLoading: previewLoading } = useDocumentPreview(
    selectedDocument?.file_name,
    { enabled: showPreview && !!selectedDocument },
  );
  const previewContent = previewData?.content || "";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(
    null,
  );

  useEffect(() => {
    const handleDocumentUploaded = (): void => {
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    };

    window.addEventListener("documentUploaded", handleDocumentUploaded);

    return (): void => {
      window.removeEventListener("documentUploaded", handleDocumentUploaded);
    };
  }, [queryClient]);

  const handleDelete = (id: string): void => {
    deleteDoc(id);
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleDownload = (doc: DocumentData): void => {
    downloadDoc(doc);
  };

  const handleViewDetails = (doc: DocumentData): void => {
    setSelectedDocument(doc);
    setShowDetails(true);
  };

  const handlePreview = (doc: DocumentData): void => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const closeDetails = (): void => {
    setShowDetails(false);
    setSelectedDocument(null);
  };

  const closePreview = (): void => {
    setShowPreview(false);
    setSelectedDocument(null);
  };

  const confirmDelete = (doc: DocumentData): void => {
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = (): void => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const { stats, supportedFormats } = statsData || {};
  const { documents } = documentsData || {};

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-sm max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-zinc-900">Documents</h3>
        </div>
        <div className="text-center py-8 text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-zinc-900">Documents</h3>
        <Button
          onClick={() => {
            refetch();
            refetchDocuments();
          }}
          variant="text"
          color="default"
          size="small"
          disabled={isFetching}
          leftIcon={
            <RefreshIcon className={cn(isFetching && 'animate-spin')} />
          }
        >
          Refresh
        </Button>
      </div>

      {(statsError || documentsError) && (
        <div className="flex items-center gap-2 py-3 px-3 bg-danger-50 border border-danger-100 rounded-md text-danger-800 mb-4">
          <WarningIcon />
          <span>
            {statsError instanceof Error
              ? statsError.message
              : documentsError instanceof Error
                ? documentsError.message
                : "Failed to load documents"}
          </span>
        </div>
      )}

      {stats?.exists ? (
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 py-3 px-3 bg-zinc-50 rounded-lg">
            <StatsIcon />
            <div className="flex-1">
              <div className="font-semibold text-zinc-900 text-sm">{stats.count} Chunks</div>
              <div className="text-zinc-500 text-[13px]">
                From {documents?.length || 0} documents
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 px-3 bg-zinc-50 rounded-lg">
            <StorageIcon />
            <div className="flex-1">
              <div className="font-semibold text-zinc-900 text-sm">
                {stats.collectionName || "documents"}
              </div>
              <div className="text-zinc-500 text-[13px]">Active collection</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 text-zinc-500">
          <EmptyStateIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="m-0.5">No documents indexed yet</p>
          <p className="text-sm text-zinc-400 m-0.5">Upload documents to get started</p>
        </div>
      )}

      {documents && documents.length > 0 && (
        <div className="my-4 border border-zinc-200 rounded-lg overflow-hidden" data-testid="document-list">
          {isFetching && !isLoading ? (
            <div className="text-center py-8 text-zinc-500">Refreshing...</div>
          ) : (
            <div className="flex flex-col">
              {documents.map((doc: DocumentData) => (
                <div key={doc.id} className="flex items-center justify-between py-3 px-4 border-b border-zinc-200 last:border-b-0 transition-colors hover:bg-zinc-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-xl flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-900 text-sm mb-1 truncate">{doc.file_name}</div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="py-0.5 px-1.5 bg-primary-100 text-primary-700 rounded font-medium text-[11px] uppercase">
                          {doc.file_type}
                        </span>
                        <span className="text-zinc-500">
                          {formatDocumentDate(doc.upload_date)}
                        </span>
                        {doc.chunk_count > 0 && (
                          <span className="text-zinc-500">
                            {doc.chunk_count} chunk
                            {doc.chunk_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <IconButton
                      icon={<InfoIcon />}
                      aria-label={`View details for ${doc.file_name}`}
                      onClick={() => handleViewDetails(doc)}
                      color="default"
                      size="small"
                    />
                    <IconButton
                      icon={<PreviewIcon />}
                      aria-label={`Preview ${doc.file_name}`}
                      onClick={() => handlePreview(doc)}
                      color="default"
                      size="small"
                    />
                    {doc.can_download && (
                      <IconButton
                        icon={<DownloadIcon />}
                        aria-label={`Download ${doc.file_name}`}
                        onClick={() => handleDownload(doc)}
                        color="default"
                        size="small"
                      />
                    )}
                    <IconButton
                      icon={<DeleteIcon className="text-red-500" />}
                      aria-label={`Delete ${doc.file_name}`}
                      onClick={() => confirmDelete(doc)}
                      color="danger"
                      size="small"
                      data-testid="delete-document-button"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {supportedFormats && supportedFormats.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200">
          <h4 className="m-0 mb-2 text-sm text-zinc-600">Supported Formats</h4>
          <div className="flex flex-wrap gap-2">
            {supportedFormats.map((format: SupportedFormat) => (
              <div key={format.type} className="flex flex-col gap-0.5 py-2 px-3 bg-primary-50 rounded-md">
                <span className="font-medium text-primary-700 text-[13px]">{format.type}</span>
                <span className="text-zinc-500 text-xs">{format.extensions}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ContentModal
        isOpen={showDetails}
        onClose={closeDetails}
        title="Document Details"
        size="medium"
        contentClassName="px-5"
        testId="details-modal"
      >
        {selectedDocument && (
          <>
            <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
              <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">File Name:</span>
              <span className="text-zinc-500 text-sm text-right break-words flex-1">
                {selectedDocument.file_name}
              </span>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
              <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">File Type:</span>
              <span className="text-zinc-500 text-sm text-right break-words flex-1">
                {selectedDocument.file_type}
              </span>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
              <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">Upload Date:</span>
              <span className="text-zinc-500 text-sm text-right break-words flex-1">
                {new Date(selectedDocument.upload_date).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
              <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">Chunks:</span>
              <span className="text-zinc-500 text-sm text-right break-words flex-1">
                {selectedDocument.chunk_count}
              </span>
            </div>
            {selectedDocument.file_size && (
              <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
                <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">File Size:</span>
                <span className="text-zinc-500 text-sm text-right break-words flex-1">
                  {selectedDocument.file_size}
                </span>
              </div>
            )}
            {selectedDocument.can_download && (
              <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-b-0">
                <span className="font-medium text-zinc-600 text-sm flex-shrink-0 mr-4">Download:</span>
                <Button
                  onClick={() => handleDownload(selectedDocument)}
                  variant="text"
                  color="primary"
                  size="small"
                >
                  Download file
                </Button>
              </div>
            )}
          </>
        )}
      </ContentModal>

      <ContentModal
        isOpen={showPreview}
        onClose={closePreview}
        title="Document Preview"
        size="large"
        testId="preview-modal"
      >
        {selectedDocument && (
          <>
            <p className="font-medium text-zinc-900 mb-4 text-base">
              {selectedDocument.file_name}
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {previewLoading ? (
                <p className="text-zinc-500 italic m-0">Loading preview...</p>
              ) : previewContent ? (
                <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-zinc-600">
                  {previewContent}
                </pre>
              ) : (
                <p className="text-zinc-500 italic m-0">
                  No content available for preview
                </p>
              )}
            </div>
          </>
        )}
      </ContentModal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={() => {
          if (documentToDelete) {
            handleDelete(documentToDelete.id);
          }
        }}
        title="Confirm Delete"
        message={
          documentToDelete
            ? `Are you sure you want to delete "${documentToDelete.file_name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        testId="delete-modal"
      />
    </div>
  );
}
