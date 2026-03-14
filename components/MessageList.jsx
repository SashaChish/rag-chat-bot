/**
 * Message List Component
 * Displays chat messages with user/bot styling and source citations
 */

"use client";

import styles from "./MessageList.module.css";

// SimilarityBar component for visual score display
const SimilarityBar = ({ score }) => {
  // Convert score to number if it's a string
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;

  // Handle invalid scores
  if (isNaN(numericScore) || numericScore === undefined || numericScore === null) {
    return null;
  }

  const percentage = Math.round(numericScore * 100);

  // Get color based on similarity
  const getColor = () => {
    if (numericScore >= 0.7) return '#10b981'; // Green
    if (numericScore >= 0.4) return '#f59e0b'; // Yellow/orange
    return '#9ca3af'; // Gray
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#e5e7eb',
      borderRadius: '9999px',
      height: '8px',
      marginTop: '4px',
      overflow: 'hidden'
    }}>
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: getColor(),
          borderRadius: '9999px',
          transition: 'width 0.3s ease-in-out'
        }}
        aria-label={`Similarity score: ${percentage}%`}
      />
    </div>
  );
};

export default function MessageList({ messages, scrollAnchorRef }) {
  // Simple markdown-like formatting
  const formatContent = (content) => {
    if (!content) return "";

    // Handle bold text
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Handle line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
  };

  // Get a helpful source explanation message based on the sources
  const getSourceExplanation = (sources) => {
    if (!sources || sources.length === 0) return "";

    const uniqueFilenames = [...new Set(sources.map(s => s.filename))];

    if (uniqueFilenames.length === 1) {
      // All chunks from the same document
      const filename = uniqueFilenames[0];
      const chunks = sources.length;
      return `${chunks} chunk${chunks !== 1 ? 's' : ''} from "${filename}" matched your query based on semantic similarity`;
    } else {
      // Multiple documents
      const docs = uniqueFilenames.length;
      return `${docs} document${docs !== 1 ? 's' : ''} matched your query based on semantic similarity`;
    }
  };

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

          <div className={`${styles.messageContent} ${message.isStreaming || message.loadingPhase ? styles.loading : ""}`}>
            {(message.isStreaming || message.loadingPhase) && (
              <span className={styles.loadingDots}>
                {message.loadingPhase === "loadingSources" ? "Loading sources" : "Thinking"}
              </span>
            )}
            <span
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className={styles.messageSources}>
              <div className={styles.sourcesExplanation}>
                {getSourceExplanation(message.sources)}
              </div>
              <div className={styles.sourcesList}>
                {message.sources.map((source, index) => (
                  <div key={index} className={styles.sourceCard}>
                    <div className={styles.sourceHeader}>
                      <span className={styles.sourceFilename}>{source.filename}</span>
                      {source.score && (
                        <span className={styles.sourceScore}>
                          score: {source.score}
                        </span>
                      )}
                    </div>
                    {source.score && <SimilarityBar score={source.score} />}
                    {source.preview && (
                      <div className={styles.sourcePreview}>{source.preview}</div>
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
