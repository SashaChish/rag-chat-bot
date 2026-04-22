"use client";

import { Stack, Text, Button } from "@mantine/core";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <Text size="xl" fw={600}>
        Something went wrong
      </Text>
      <Text c="dimmed">{error.message}</Text>
      <Button onClick={reset} color="violet">
        Try again
      </Button>
    </Stack>
  );
}
