'use client';

import Chat from '@/components/Chat/Chat';
import UploadWrapper from '@/components/Upload/UploadWrapper';
import DocumentList from '@/components/DocumentList/DocumentList';
import { IconButton } from '@/components/ui/IconButton';
import { RobotIcon, SidebarCloseIcon } from '@/lib/icons';
import { useSidebarState } from '@/lib/hooks/use-sidebar-state';

export default function Home() {
  const { isOpen, isDesktop, close, toggle } = useSidebarState();

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white py-6 px-8 border-b border-zinc-200 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <RobotIcon className="w-10 h-10" />
          <h1 className="m-0 text-4xl text-zinc-900">RAG Chatbot</h1>
        </div>
        <p className="m-0 text-zinc-500 text-base">Upload documents and ask questions using AI</p>
      </header>

      <div className="flex-1 flex gap-6 p-6 max-w-[1400px] mx-auto w-full overflow-hidden min-h-0">
        {isDesktop ? (
          <>
            <aside className="w-[350px] flex flex-col gap-4 min-h-0 overflow-y-auto">
              <div className="flex-shrink-0">
                <UploadWrapper />
              </div>
              <div className="flex-shrink-0">
                <DocumentList />
              </div>
            </aside>
            <section className="flex-1 min-w-0 min-h-0 flex flex-col">
              <Chat />
            </section>
          </>
        ) : (
          <>
            <section className="flex-1 min-w-0 min-h-0 flex flex-col">
              <Chat onToggleSidebar={toggle} sidebarToggleVisible />
            </section>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-40 animate-[fadeIn_0.15s_ease-out]"
                  onClick={close}
                  data-testid="sidebar-overlay"
                />
                <aside
                  className="fixed left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white z-50 flex flex-col overflow-hidden animate-[slideInLeft_0.3s_ease-out]"
                  onClick={(e) => e.stopPropagation()}
                  data-testid="mobile-sidebar"
                >
                  <div className="flex justify-between items-center py-4 px-5 border-b border-zinc-200 flex-shrink-0">
                    <h2 className="m-0 text-lg font-semibold text-zinc-900">Documents</h2>
                    <IconButton
                      icon={<SidebarCloseIcon />}
                      aria-label="Close sidebar"
                      onClick={close}
                      color="default"
                      size="small"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-5 min-h-0">
                    <div className="flex-shrink-0">
                      <UploadWrapper />
                    </div>
                    <div className="flex-shrink-0">
                      <DocumentList />
                    </div>
                  </div>
                </aside>
              </>
            )}
          </>
        )}
      </div>

      <footer className="bg-white py-4 px-4 text-center border-t border-zinc-200 text-zinc-500 text-sm">
        <p className="m-0">
          Powered by <strong className="text-primary-600">LlamaIndex.TS</strong> and <strong className="text-primary-600">Chroma</strong>
        </p>
      </footer>
    </main>
  );
}
