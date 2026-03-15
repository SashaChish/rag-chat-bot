'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './DocumentList.module.css';
import type {
  DocumentData,
  DocumentStats,
  SupportedFormat,
} from './DocumentList.types';
import {
  getFileIcon,
  formatDocumentDate,
} from './DocumentList.utils';
import { useDocumentDownload } from '@/lib/hooks/use-document-download';

export default function DocumentList(): JSX.Element {
  const queryClient = useQueryClient();
  const downloadMutation = useDocumentDownload();

  const statsQuery = useQuery({
    queryKey: ['documents-stats'],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to load document stats");
      }
      return response.json() as Promise<{ stats: DocumentStats; supportedFormats: SupportedFormat[] }>;
    },
  });
  const documentsQuery = useQuery({
    queryKey: ['documents-list'],
    queryFn: async () => {
      const response = await fetch("/api/documents?action=list");
      if (!response.ok) {
        throw new Error("Failed to load document list");
      }
      return response.json() as Promise<{ documents: DocumentData[] }>;
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['documents-list'] });
      const previousDocuments = queryClient.getQueryData<{ documents: DocumentData[] }>(['documents-list']);
      
      queryClient.setQueryData<{ documents: DocumentData[] }>(['documents-list'], (old) =>
        old ? { documents: old.documents.filter(doc => doc.id !== id) } : old
      );

      return { previousDocuments };
    },
    onError: (error, id, context) => {
      console.error("Error deleting document:", error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents-list'], context.previousDocuments);
      }
      alert(error instanceof Error ? error.message : "Failed to delete document");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    },
  });
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
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
    deleteMutation.mutate(id);
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleDownload = (doc: DocumentData): void => {
    downloadMutation.mutate(doc);
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





  if (statsQuery.isLoading) {
    return (
      <div className={styles.documentList}>
        <div className={styles.documentListHeader}>
          <h3>Documents</h3>
        </div>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.documentList}>
      <div className={styles.documentListHeader}>
        <h3>Documents</h3>
        <button
          onClick={() => {
            statsQuery.refetch();
            documentsQuery.refetch();
          }}
          className={`${styles.refreshButton} ${documentsQuery.isFetching ? styles.spinning : ""}`}
          disabled={documentsQuery.isFetching}
          type="button"
        >
          <span className={styles.refreshIcon}>🔄</span>
          <span className={styles.refreshText}> Refresh</span>
        </button>
      </div>

      {(statsQuery.error || documentsQuery.error) && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>
            {statsQuery.error instanceof Error 
              ? statsQuery.error.message 
              : documentsQuery.error instanceof Error 
                ? documentsQuery.error.message 
                : "Failed to load documents"}
          </span>
        </div>
      )}

      {statsQuery.data?.stats && statsQuery.data.stats.exists ? (
        <div className={styles.documentStats}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{statsQuery.data.stats.count} Chunks</div>
              <div className={styles.statLabel}>
                From {documentsQuery.data?.documents?.length || 0} documents
              </div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🗂️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {statsQuery.data.stats.collectionName || "documents"}
              </div>
              <div className={styles.statLabel}>Active collection</div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p>No documents indexed yet</p>
          <p className={styles.emptyHint}>Upload documents to get started</p>
        </div>
      )}

      {documentsQuery.data?.documents && documentsQuery.data.documents.length > 0 && (
        <div className={styles.documentListContainer}>
          {documentsQuery.isFetching && !documentsQuery.isLoading ? (
            <div className={styles.loadingState}>Refreshing...</div>
          ) : (
            <div className={styles.documentItems}>
              {documentsQuery.data.documents.map((doc: DocumentData) => (
                <div key={doc.id} className={styles.documentItem}>
                  <div className={styles.documentMain}>
                    <div className={styles.documentIcon}>
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className={styles.documentInfo}>
                      <div className={styles.documentName}>{doc.file_name}</div>
                      <div className={styles.documentMeta}>
                        <span className={styles.documentType}>
                          {doc.file_type}
                        </span>
                        <span className={styles.documentDate}>
                          {formatDocumentDate(doc.upload_date)}
                        </span>
                        {doc.chunk_count > 0 && (
                          <span className={styles.documentChunks}>
                            {doc.chunk_count} chunk
                            {doc.chunk_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.documentActions}>
                    <button
                      onClick={() => handleViewDetails(doc)}
                      className={styles.actionButton}
                      title="View details"
                      type="button"
                    >
                      ℹ️
                    </button>
                    <button
                      onClick={() => handlePreview(doc)}
                      className={styles.actionButton}
                      title="Preview content"
                      type="button"
                    >
                      👁️
                    </button>
                    {doc.file_url && (
                      <button
                        onClick={() => handleDownload(doc)}
                        className={styles.actionButton}
                        title="Download file"
                        type="button"
                      >
                        ⬇️
                      </button>
                    )}
                    <button
                      onClick={() => confirmDelete(doc)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Delete document"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statsQuery.data?.supportedFormats && statsQuery.data.supportedFormats.length > 0 && (
        <div className={styles.supportedFormats}>
          <h4>Supported Formats</h4>
          <div className={styles.formatsGrid}>
            {statsQuery.data.supportedFormats.map((format: SupportedFormat) => (
              <div key={format.type} className={styles.formatItem}>
                <span className={styles.formatName}>{format.type}</span>
                <span className={styles.formatExt}>{format.extensions}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDetails && selectedDocument && (
        <div className={styles.modalOverlay} onClick={closeDetails}>
          <div
            className={styles.modal}
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <h3>Document Details</h3>
              <button
                onClick={closeDetails}
                className={styles.closeButton}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File Name:</span>
                <span className={styles.detailValue}>
                  {selectedDocument.file_name}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>File Type:</span>
                <span className={styles.detailValue}>
                  {selectedDocument.file_type}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Upload Date:</span>
                <span className={styles.detailValue}>
                  {new Date(selectedDocument.upload_date).toLocaleString()}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Chunks:</span>
                <span className={styles.detailValue}>
                  {selectedDocument.chunk_count}
                </span>
              </div>
              {selectedDocument.file_size && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>File Size:</span>
                  <span className={styles.detailValue}>
                    {selectedDocument.file_size}
                  </span>
                </div>
              )}
              {selectedDocument.file_url && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Download:</span>
                  <a
                    href={selectedDocument.file_url}
                    download={selectedDocument.file_name}
                    className={styles.detailLink}
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPreview && selectedDocument && (
        <div className={styles.modalOverlay} onClick={closePreview}>
          <div
            className={`${styles.modal} ${styles.largeModal}`}
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <h3>Document Preview</h3>
              <button
                onClick={closePreview}
                className={styles.closeButton}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.previewFileName}>
                {selectedDocument.file_name}
              </p>
              <div className={styles.previewContent}>
                {selectedDocument.content ? (
                  <pre className={styles.previewText}>
                    {selectedDocument.content}
                  </pre>
                ) : (
                  <p className={styles.noPreview}>
                    No content available for preview
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && documentToDelete && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div
            className={`${styles.modal} ${styles.confirmModal}`}
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <h3>Confirm Delete</h3>
              <button
                onClick={cancelDelete}
                className={styles.closeButton}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete this document?</p>
              <p className={styles.confirmFileName}>
                {documentToDelete.file_name}
              </p>
              <p className={styles.confirmWarning}>
                This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button
                  onClick={cancelDelete}
                  className={styles.cancelButton}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(documentToDelete.id)}
                  className={styles.confirmDeleteButton}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
