/**
 * Root Layout for Next.js App
 */

import "./globals.css";

export const metadata = {
  title: "RAG Chatbot",
  description: "Upload documents and ask questions using AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
