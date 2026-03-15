import Chat from '@/components/Chat/Chat';
import UploadWrapper from './UploadWrapper';
import DocumentList from '@/components/DocumentList/DocumentList';
import styles from './page.module.css';

export default function Home(): JSX.Element {
  return (
    <main className={styles.appContainer}>
      <header className={styles.appHeader}>
        <h1>🤖 RAG Chatbot</h1>
        <p>Upload documents and ask questions using AI</p>
      </header>

      <div className={styles.appContent}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <UploadWrapper />
          </div>
          <div className={styles.sidebarSection}>
            <DocumentList />
          </div>
        </aside>

        <section className={styles.mainContent}>
          <Chat onSendMessage={undefined} />
        </section>
      </div>

      <footer className={styles.appFooter}>
        <p>
          Powered by <strong>LlamaIndex.TS</strong> and <strong>Chroma</strong>
        </p>
      </footer>
    </main>
  );
}