/**
 * Document List Component
 * Displays list of indexed documents with stats
 */

"use client";

import { useState, useEffect } from "react";
import styles from "./DocumentList.module.css";

export default function DocumentList() {
  const [stats, setStats] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentStats();
  }, []);

  const fetchDocumentStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/documents");
      const data = await response.json();
      setStats(data.stats);
      setSupportedFormats(data.supportedFormats || []);
    } catch (error) {
      console.error("Error fetching document stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.documentList}>
        <h3>Documents</h3>
        <div className={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.documentList}>
      <div className={styles.documentListHeader}>
        <h3>Documents</h3>
        <button onClick={fetchDocumentStats} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {stats && stats.exists ? (
        <div className={styles.documentStats}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>Indexed</div>
              <div className={styles.statLabel}>Documents available for search</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🗂️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.collectionName || "documents"}</div>
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

      {supportedFormats.length > 0 && (
        <div className={styles.supportedFormats}>
          <h4>Supported Formats</h4>
          <div className={styles.formatsGrid}>
            {supportedFormats.map((format) => (
              <div key={format.type} className={styles.formatItem}>
                <span className={styles.formatName}>{format.type}</span>
                <span className={styles.formatExt}>{format.extensions}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
