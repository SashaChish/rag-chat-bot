import Chat from '@/components/Chat/Chat';
import UploadWrapper from '@/components/Upload/UploadWrapper';
import DocumentList from '@/components/DocumentList/DocumentList';
import { RobotIcon } from '@/lib/icons';

export default function Home(): JSX.Element {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white py-6 px-8 border-b border-zinc-200 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <RobotIcon className="w-10 h-10" />
          <h1 className="m-0 text-4xl text-zinc-900">RAG Chatbot</h1>
        </div>
        <p className="m-0 text-zinc-500 text-base">Upload documents and ask questions using AI</p>
      </header>

      <div className="flex-1 flex gap-6 p-6 max-w-[1400px] mx-auto w-full overflow-hidden min-h-0 max-lg:flex-col">
        <aside className="w-[350px] flex flex-col gap-4 min-h-0 overflow-y-auto max-lg:w-full max-lg:max-w-[500px] max-lg:mx-auto max-lg:max-h-[40%] max-lg:order-2 max-sm:max-h-[35%] max-sm:p-4">
          <div className="flex-shrink-0">
            <UploadWrapper />
          </div>
          <div className="flex-shrink-0">
            <DocumentList />
          </div>
        </aside>

        <section className="flex-1 min-w-0 min-h-0 flex flex-col max-lg:min-h-0 max-lg:flex-1 max-lg:order-1">
          <Chat />
        </section>
      </div>

      <footer className="bg-white py-4 px-4 text-center border-t border-zinc-200 text-zinc-500 text-sm">
        <p className="m-0">
          Powered by <strong className="text-primary-600">LlamaIndex.TS</strong> and <strong className="text-primary-600">Chroma</strong>
        </p>
      </footer>
    </main>
  );
}
