import { Stack, Text, Title } from '@mantine/core';

export default function NotFound() {
  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      <Title order={3}>Not Found</Title>
      <Text c="dimmed">The page you are looking for does not exist.</Text>
    </Stack>
  );
}
