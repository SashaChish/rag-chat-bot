'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './DocumentList.module.css';
import type { DocumentListProps } from '../../lib/types/components';
import type {
  DocumentData,
  DocumentStats,
  SupportedFormat,
} from './DocumentList.types';
import {
  getFileIcon,
  formatDocumentDate,
} from './DocumentList.utils';

export default function DocumentList(): JSX.Element {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<SupportedFormat[]>(
    [],
  );
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentStats = useCallback(
    async (isRefresh: boolean = false): Promise<void> => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }
        const response = await fetch("/api/documents");
        const data = await response.json();
        setStats(data.stats);
        setSupportedFormats(data.supportedFormats || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching document stats:", error);
        setError("Failed to load document stats");
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setInitialLoading(false);
        }
      }
    },
    [],
  );

  const fetchDocumentList = useCallback(async (): Promise<void> => {
    try {
      setListLoading(true);
      const response = await fetch("/api/documents?action=list");
      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching document list:", error);
      setError("Failed to load document list");
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchData = useCallback(
    async (isRefresh: boolean = false): Promise<void> => {
      await Promise.all([fetchDocumentStats(isRefresh), fetchDocumentList()]);
    },
    [fetchDocumentStats, fetchDocumentList],
  );

  useEffect(() => {
    fetchData(false);

    const handleDocumentUploaded = (): void => {
      fetchData(true);
    };

    window.addEventListener("documentUploaded", handleDocumentUploaded);

    return (): void => {
      window.removeEventListener("documentUploaded", handleDocumentUploaded);
    };
  }, [fetchData]);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      setShowDeleteConfirm(false);
      setDocumentToDelete(null);

      await fetchData(true);
    } catch (error) {
      console.error("Error deleting document:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete document";
      alert(errorMessage);
    }
  };

  const handleDownload = (doc: DocumentData): void => {
    if (doc.file_url) {
      const link = document.createElement("a");
      link.href = doc.file_url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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





  if (initialLoading) {
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
          onClick={() => fetchData(true)}
          className={`${styles.refreshButton} ${refreshing ? styles.spinning : ""}`}
          disabled={refreshing}
          type="button"
        >
          <span className={styles.refreshIcon}>🔄</span>
          <span className={styles.refreshText}> Refresh</span>
        </button>
      </div>

      {error && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {stats && stats.exists ? (
        <div className={styles.documentStats}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.count} Chunks</div>
              <div className={styles.statLabel}>
                From {documents.length} documents
              </div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🗂️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {stats.collectionName || "documents"}
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

      {documents.length > 0 && (
        <div className={styles.documentListContainer}>
          {listLoading ? (
            <div className={styles.loadingState}>Loading documents...</div>
          ) : (
            <div className={styles.documentItems}>
              {documents.map((doc: DocumentData) => (
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

      {supportedFormats.length > 0 && (
        <div className={styles.supportedFormats}>
          <h4>Supported Formats</h4>
          <div className={styles.formatsGrid}>
            {supportedFormats.map((format: SupportedFormat) => (
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
