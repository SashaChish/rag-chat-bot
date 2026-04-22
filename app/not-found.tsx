import { Stack, Text } from '@mantine/core';

export default function NotFound() {
  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <Text size="xl" fw={600}>Not Found</Text>
      <Text c="dimmed">The page you are looking for does not exist.</Text>
    </Stack>
  );
}
