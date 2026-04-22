"use client";

import {
  AppShell,
  Group,
  Text,
  Stack,
  ScrollArea,
  Affix,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Chat from "@/components/Chat/Chat";
import Upload from "@/components/Upload/Upload";
import DocumentList from "@/components/DocumentList/DocumentList";
import { IconSparkles, IconLayoutSidebar } from "@tabler/icons-react";

export default function Home() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <>
      <AppShell
        padding="md"
        header={{ height: { base: 120 } }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        footer={{ height: { base: 50 } }}
        styles={{
          main: {
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100dvh",
            boxSizing: "border-box",
            maxWidth: 1400,
            margin: "0 auto",
          },
        }}
      >
        <AppShell.Header>
          <Group
            justify="center"
            py="lg"
            px="xl"
            style={{ flexDirection: "column" }}
          >
            <Group gap="md">
              <IconSparkles size={40} aria-hidden="true" />
              <Text fw={700} size="xl" style={{ fontSize: "2rem" }}>
                RAG Chatbot
              </Text>
            </Group>
            <Text c="dimmed" size="md">
              Upload documents and ask questions using AI
            </Text>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar>
          <AppShell.Section grow component={ScrollArea} p="md">
            <Stack gap="md">
              <Upload />
              <DocumentList />
            </Stack>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Chat />
        </AppShell.Main>

        <AppShell.Footer>
          <Group justify="center" py="sm" px="md">
            <Text c="dimmed" size="sm">
              Powered by{" "}
              <Text component="span" fw={600} c="violet" inherit>
                LlamaIndex.TS
              </Text>{" "}
              and{" "}
              <Text component="span" fw={600} c="violet" inherit>
                Chroma
              </Text>
            </Text>
          </Group>
        </AppShell.Footer>
      </AppShell>

      <Affix position={{ bottom: 60, left: 20 }} hiddenFrom="sm">
        <ActionIcon
          size="lg"
          variant="filled"
          color="violet"
          radius="xl"
          aria-label="Open sidebar"
          onClick={toggleMobile}
        >
          <IconLayoutSidebar size={20} aria-hidden="true" />
        </ActionIcon>
      </Affix>

      <Affix position={{ bottom: 60, left: 20 }} visibleFrom="sm">
        <ActionIcon
          size="lg"
          variant="filled"
          color="violet"
          radius="xl"
          aria-label="Open sidebar"
          onClick={toggleDesktop}
        >
          <IconLayoutSidebar size={20} aria-hidden="true" />
        </ActionIcon>
      </Affix>
    </>
  );
}
