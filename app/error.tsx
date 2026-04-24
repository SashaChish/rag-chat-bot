"use client";

import { Stack, Text, Button, Title } from "@mantine/core";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <Title order={3}>
        Something went wrong
      </Title>
      <Text c="dimmed">{error.message}</Text>
      <Button onClick={reset} color="primary">
        Try again
      </Button>
    </Stack>
  );
}
