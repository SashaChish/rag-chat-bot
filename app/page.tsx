"use client";

import { AppShell, Group, Text, Stack, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Chat from "@/components/Chat/Chat";
import Upload from "@/components/Upload/Upload";
import DocumentList from "@/components/DocumentList/DocumentList";
import { IconButton } from "@/components/ui/IconButton";
import { RobotIcon, SidebarCloseIcon } from "@/lib/icons";

export default function Home() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      padding={0}
      header={{ height: { base: 100 } }}
      navbar={{
        width: 350,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      footer={{ height: { base: 50 } }}
      styles={{
        main: {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "var(--mantine-spacing-md)",
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
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
            <RobotIcon />
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
        <AppShell.Section>
          <Group justify="space-between" py="md" px="md" visibleFrom="sm">
            <Text fw={600} size="lg">
              Documents
            </Text>
            <IconButton
              icon={<SidebarCloseIcon />}
              aria-label="Close sidebar"
              onClick={toggleDesktop}
              color="default"
              size="small"
            />
          </Group>
          <Group justify="space-between" py="md" px="md" hiddenFrom="sm">
            <Text fw={600} size="lg">
              Documents
            </Text>
            <IconButton
              icon={<SidebarCloseIcon />}
              aria-label="Close sidebar"
              onClick={closeMobile}
              color="default"
              size="small"
            />
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} p="md">
          <Stack gap="md">
            <Upload />
            <DocumentList />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Chat
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              toggleMobile();
            } else {
              toggleDesktop();
            }
          }}
          sidebarToggleVisible={!desktopOpened}
        />
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
