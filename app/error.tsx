"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-zinc-900">Something went wrong</h2>
      <p className="text-zinc-500">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
