import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RAG Chatbot",
  description: "Upload documents and ask questions using AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}