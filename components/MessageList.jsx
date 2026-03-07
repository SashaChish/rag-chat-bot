/**
 * Message List Component
 * Displays chat messages with user/bot styling and source citations
 */

"use client";

import styles from "./MessageList.module.css";

export default function MessageList({ messages, isLoading }) {
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

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && !isLoading && (
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

          <div className={`${styles.messageContent} ${message.isStreaming ? styles.loading : ""}`}>
            {message.isStreaming && (
              <span className={styles.loadingDots}>Thinking</span>
            )}
            <span
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className={styles.messageSources}>
              <div className={styles.sourcesTitle}>Sources:</div>
              <ul className={styles.sourcesList}>
                {message.sources.map((source, index) => (
                  <li key={index} className={styles.sourceItem}>
                    <span className={styles.sourceFilename}>{source.filename}</span>
                    {source.score && (
                      <span className={styles.sourceScore}>
                        (score: {source.score})
                      </span>
                    )}
                    {source.preview && (
                      <div className={styles.sourcePreview}>{source.preview}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className={`${styles.message} ${styles.messageAssistant}`}>
          <div className={styles.messageHeader}>
            <span className={styles.messageRole}>AI Assistant</span>
          </div>
          <div className={`${styles.messageContent} ${styles.loading}`}>
            <span className={styles.loadingDots}>Thinking</span>
          </div>
        </div>
      )}
    </div>
  );
}
