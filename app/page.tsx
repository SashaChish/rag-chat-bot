"use client";

import {
  AppShell,
  Group,
  Text,
  Stack,
  ScrollArea,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Chat from "@/components/Chat/Chat";
import Upload from "@/components/Upload/Upload";
import DocumentList from "@/components/DocumentList/DocumentList";
import { IconButton } from "@/components/ui/IconButton";
import {
  IconSparkles,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

export default function Home() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      padding="md"
      header={{ height: { base: 120 } }}
      navbar={{
        width: desktopOpened ? 350 : 60,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: false },
      }}
      footer={{ height: { base: 50 } }}
      styles={{
        navbar: {
          transition: "width 300ms ease",
        },
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
            <IconButton
              icon={<IconChevronRight size={20} aria-hidden="true" />}
              ariaLabel="Open sidebar"
              onClick={toggleMobile}
              color="gray"
              hiddenFrom="sm"
            />
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
        {desktopOpened ? (
          <>
            <AppShell.Section>
              <Group justify="space-between" py="md" px="md" wrap="nowrap">
                <Text fw={600} size="lg">
                  Documents
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <IconButton
                    icon={<IconChevronLeft size={20} aria-hidden="true" />}
                    ariaLabel="Collapse sidebar"
                    onClick={toggleDesktop}
                    color="gray"
                    visibleFrom="sm"
                  />
                  <IconButton
                    icon={<IconChevronLeft size={20} aria-hidden="true" />}
                    ariaLabel="Close sidebar"
                    onClick={toggleMobile}
                    color="gray"
                    hiddenFrom="sm"
                  />
                </Group>
              </Group>
            </AppShell.Section>

            <AppShell.Section grow component={ScrollArea} p="md">
              <Stack gap="md">
                <Upload />
                <DocumentList />
              </Stack>
            </AppShell.Section>
          </>
        ) : (
          <AppShell.Section>
            <Center py="md" px="xs">
              <IconButton
                icon={<IconChevronRight size={20} aria-hidden="true" />}
                ariaLabel="Expand sidebar"
                onClick={toggleDesktop}
                color="gray"
                visibleFrom="sm"
              />
            </Center>
          </AppShell.Section>
        )}
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
  );
}
