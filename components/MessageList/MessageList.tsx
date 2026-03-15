'use client';

import { SourceInfo } from '../../lib/types/core.types';
import styles from './MessageList.module.css';
import type { MessageListProps } from '../../lib/types/components';
import type { SimilarityBarProps } from './MessageList.types';
import {
  formatContent,
  getSourceExplanation,
  getSimilarityColor,
  getSimilarityPercentage,
  isValidScore,
} from './MessageList.utils';

const SimilarityBar = ({ score }: SimilarityBarProps): JSX.Element | null => {
  if (!isValidScore(score)) {
    return null;
  }

  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  const percentage = getSimilarityPercentage(numericScore);
  const color = getSimilarityColor(numericScore);

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#e5e7eb",
        borderRadius: "9999px",
        height: "8px",
        marginTop: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '9999px',
          transition: 'width 0.3s ease-in-out',
        }}
        aria-label={`Similarity score: ${percentage}%`}
      />
    </div>
  );
};

export default function MessageList({
  messages,
  scrollAnchorRef,
}: MessageListProps): JSX.Element {


  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>💬</div>
          <h3>No messages yet</h3>
          <p>Upload a document and start asking questions!</p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${styles[`message${message.role.charAt(0).toUpperCase() + message.role.slice(1)}`]} ${message.error ? styles.messageError : ""}`}
        >
          <div className={styles.messageHeader}>
            <span className={styles.messageRole}>
              {message.role === "user" ? "You" : "AI Assistant"}
            </span>
            <span className={styles.messageTime}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div
            className={`${styles.messageContent} ${message.isStreaming || message.loadingPhase ? styles.loading : ""}`}
          >
            {(message.isStreaming || message.loadingPhase) && (
              <span className={styles.loadingDots}>
                {message.loadingPhase === "loadingSources"
                  ? "Loading sources"
                  : "Thinking"}
              </span>
            )}
            <span
              dangerouslySetInnerHTML={{
                __html: formatContent(message.content),
              }}
            />
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className={styles.messageSources}>
              <div className={styles.sourcesExplanation}>
                {getSourceExplanation(message.sources)?.text}
              </div>
              <div className={styles.sourcesList}>
                {message.sources.map((source: SourceInfo, index: number) => (
                  <div key={index} className={styles.sourceCard}>
                    <div className={styles.sourceHeader}>
                      <span className={styles.sourceFilename}>
                        {source.filename}
                      </span>
                      {source.score && (
                        <span className={styles.sourceScore}>
                          score: {source.score}
                        </span>
                      )}
                    </div>
                    {source.score && <SimilarityBar score={source.score} />}
                    {source.preview && (
                      <div className={styles.sourcePreview}>
                        {source.preview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={scrollAnchorRef} />
    </div>
  );
}
