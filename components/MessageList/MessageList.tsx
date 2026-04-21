"use client";

import type { SourceInfo } from "../../lib/types/core.types";
import type { MessageListProps } from "../../lib/types/components";
import type { SimilarityBarProps } from "./MessageList.types";
import { cn } from "@/lib/utils/cn";
import { ChatEmptyIcon } from "@/lib/icons";
import {
  formatContent,
  getSourceExplanation,
  getSimilarityColor,
  getSimilarityPercentage,
  isValidScore,
} from "./MessageList.utils";

const SimilarityBar = ({ score }: SimilarityBarProps) => {
  if (!isValidScore(score)) {
    return null;
  }

  const numericScore = typeof score === "string" ? parseFloat(score) : score;
  const percentage = getSimilarityPercentage(numericScore);
  const color = getSimilarityColor(numericScore);

  return (
    <div className="w-full bg-zinc-200 rounded-full h-2 mt-1 overflow-hidden">
      <div
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
        className="h-full rounded-full transition-all duration-300"
        aria-label={`Similarity score: ${percentage}%`}
      />
    </div>
  );
};

export default function MessageList({
  messages,
  scrollAnchorRef,
}: MessageListProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="text-center p-12 text-zinc-500">
          <ChatEmptyIcon className="w-16 h-16 mx-auto mb-4" />
          <h3 className="m-0 mb-2 text-zinc-600">No messages yet</h3>
          <p className="m-0">Upload a document and start asking questions!</p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex flex-col gap-2 animate-[slideIn_0.3s_ease-out]",
            message.role === "user" && "items-end",
            message.role === "assistant" && "items-start",
            message.error && "bg-danger-50",
          )}
          data-testid={
            message.role === "assistant" ? "chat-response" : undefined
          }
        >
          <div
            className={cn(
              "flex justify-between items-center gap-4 text-sm",
              message.role === "user" && "flex-row-reverse",
            )}
          >
            <span className="font-semibold text-zinc-600">
              {message.role === "user" ? "You" : "AI Assistant"}
            </span>
            <span className="text-xs text-zinc-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div
            className={cn(
              "py-3 px-4 rounded-2xl max-w-[80%] leading-relaxed break-words",
              message.role === "user" &&
                "bg-gradient-to-r from-primary-500 to-accent-600 text-white rounded-br-sm",
              message.role === "assistant" &&
                !message.error &&
                "bg-zinc-100 text-zinc-800 rounded-bl-sm",
              message.error && "bg-danger-100 text-danger-800",
              (message.isStreaming || message.loadingPhase) && "loading",
            )}
          >
            {(message.isStreaming || message.loadingPhase) && (
              <span className="loading-dots" data-testid="streaming-indicator">
                {message.loadingPhase === "loadingSources"
                  ? "Loading sources"
                  : "Thinking"}
              </span>
            )}
            <span
              dangerouslySetInnerHTML={{
                __html: formatContent(
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content),
                ),
              }}
            />
          </div>

          {message.sources && message.sources.length > 0 && (
            <div
              className="mt-2 py-2 px-3 bg-primary-50 rounded-lg border-l-[3px] border-primary-500"
              data-testid="sources-section"
            >
              <div className="text-sm text-zinc-600 mb-3 font-semibold">
                {getSourceExplanation(message.sources)?.text}
              </div>
              <div className="flex flex-col gap-4">
                {message.sources.map((source: SourceInfo, index: number) => (
                  <div
                    key={index}
                    className="bg-white border border-zinc-300 rounded-lg p-3 transition-all hover:shadow-md hover:-translate-y-px"
                    data-testid="source-item"
                  >
                    <div className="flex justify-between items-center mb-2 gap-2">
                      <span className="font-semibold text-primary-700 text-sm">
                        {source.filename}
                      </span>
                      {source.score && (
                        <span className="text-sm text-zinc-500 font-medium">
                          score: {source.score}
                        </span>
                      )}
                    </div>
                    {source.score && <SimilarityBar score={source.score} />}
                    {source.preview && (
                      <div className="text-sm text-zinc-500 italic mt-3 leading-relaxed">
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
