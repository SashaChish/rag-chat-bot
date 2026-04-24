"use client";

import {
  Paper,
  Stack,
  Group,
  Text,
  Progress,
  Loader,
  ScrollArea,
  Box,
  Center,
  Title,
} from "@mantine/core";
import type { SourceInfo } from "../../lib/types/core.types";
import type { MessageListProps } from "../../lib/types/components";
import type { SimilarityBarProps } from "./MessageList.types";
import { IconMessageChatbot } from "@tabler/icons-react";
import { formatTime } from "@/lib/utils/date.utils";
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
    <Progress
      value={percentage}
      size="xs"
      mt={4}
      style={{ backgroundColor: "var(--mantine-color-gray-2)" }}
      color={color}
      aria-label={`Similarity score: ${percentage}%`}
    />
  );
};

export default function MessageList({
  messages,
  scrollAnchorRef,
}: MessageListProps) {
  return (
    <ScrollArea style={{ flex: 1 }} p="md">
      <Stack gap="md">
        {messages.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconMessageChatbot size={64} aria-hidden="true" />
              <Title order={5} c="dimmed">
                No messages yet
              </Title>
              <Text c="dimmed">
                Upload a document and start asking questions!
              </Text>
            </Stack>
          </Center>
        )}

        {messages.map((message) => (
          <Box
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
            }}
            data-testid={
              message.role === "assistant" ? "chat-response" : undefined
            }
          >
            <Group
              justify="space-between"
              gap="md"
              style={{
                width: "100%",
                flexDirection: message.role === "user" ? "row-reverse" : "row",
              }}
            >
              <Text fw={600} c="dimmed" size="sm">
                {message.role === "user" ? "You" : "AI Assistant"}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTime(message.timestamp)}
              </Text>
            </Group>

            <Paper
              radius="lg"
              py="sm"
              px="md"
              style={{
                maxWidth: "80%",
                lineHeight: 1.6,
                wordBreak: "break-word",
                background:
                  message.role === "user"
                    ? "linear-gradient(to right, var(--mantine-color-violet-5), var(--mantine-color-violet-7))"
                    : message.error
                      ? "var(--mantine-color-red-1)"
                      : "var(--mantine-color-gray-1)",
                color:
                  message.role === "user"
                    ? "white"
                    : message.error
                      ? "var(--mantine-color-red-8)"
                      : "var(--mantine-color-dark)",
                borderBottomRightRadius:
                  message.role === "user" ? 4 : undefined,
                borderBottomLeftRadius:
                  message.role === "assistant" && !message.error
                    ? 4
                    : undefined,
              }}
            >
              {(message.isStreaming || message.loadingPhase) && (
                <Group gap="xs" mb={4} data-testid="streaming-indicator">
                  <Loader type="dots" size="xs" />
                  <Text size="sm" inherit>
                    {message.loadingPhase === "loadingSources"
                      ? "Loading sources"
                      : "Thinking"}
                  </Text>
                </Group>
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
            </Paper>

            {message.sources && message.sources.length > 0 && (
              <Paper
                bg="violet.0"
                radius="md"
                p="sm"
                mt={8}
                style={{
                  borderLeft: "3px solid var(--mantine-color-violet-5)",
                }}
                data-testid="sources-section"
              >
                <Text size="sm" c="dimmed" fw={600} mb="sm">
                  {getSourceExplanation(message.sources)?.text}
                </Text>
                <Stack gap="sm">
                  {message.sources.map((source: SourceInfo, index: number) => (
                    <Paper
                      key={index}
                      withBorder
                      radius="md"
                      p="sm"
                      data-testid="source-item"
                    >
                      <Group justify="space-between" mb="xs" wrap="nowrap">
                        <Text fw={600} c="violet.7" size="sm">
                          {source.filename}
                        </Text>
                        {source.score && (
                          <Text size="sm" c="dimmed" fw={500}>
                            score: {source.score}
                          </Text>
                        )}
                      </Group>
                      {source.score && <SimilarityBar score={source.score} />}
                      {source.preview && (
                        <Text
                          c="dimmed"
                          size="sm"
                          fs="italic"
                          mt="sm"
                        >
                          {source.preview}
                        </Text>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        ))}
        <div ref={scrollAnchorRef} />
      </Stack>
    </ScrollArea>
  );
}
