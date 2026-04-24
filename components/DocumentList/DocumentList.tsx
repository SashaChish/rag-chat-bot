"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  ScrollArea,
  Center,
  Loader,
  Alert,
  Divider,
  Box,
  Title,
  Code,
} from "@mantine/core";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { ConfirmModal, ContentModal } from "../ui/Modal";
import {
  IconRefresh,
  IconAlertTriangle,
  IconChartBar,
  IconFolder,
  IconInbox,
  IconInfoCircle,
  IconEye,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";
import type { DocumentData } from "./DocumentList.types";
import { getFileIcon } from "./DocumentList.utils";
import { formatDate, formatDateTime } from "@/lib/utils/date.utils";
import { useDocumentStats } from "@/lib/hooks/use-document-stats";
import { useDocumentList } from "@/lib/hooks/use-document-list";
import { useDocumentPreview } from "@/lib/hooks/use-document-preview";
import { useDocumentDelete } from "@/lib/hooks/use-document-delete";
import { useDocumentDownload } from "@/lib/hooks/use-document-download";

export default function DocumentList() {
  const queryClient = useQueryClient();
  const { mutate: downloadDoc } = useDocumentDownload();
  const {
    data: statsData,
    isLoading,
    error: statsError,
    refetch,
  } = useDocumentStats();
  const {
    data: documentsData,
    isFetching,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocumentList();
  const { mutate: deleteDoc } = useDocumentDelete();
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { data: previewData, isLoading: previewLoading } = useDocumentPreview(
    selectedDocument?.file_name,
    { enabled: showPreview && !!selectedDocument },
  );
  const previewContent = previewData?.content || "";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(
    null,
  );

  useEffect(() => {
    const handleDocumentUploaded = (): void => {
      queryClient.invalidateQueries({ queryKey: ["documents-stats"] });
      queryClient.invalidateQueries({ queryKey: ["documents-list"] });
    };
    window.addEventListener("documentUploaded", handleDocumentUploaded);
    return (): void => {
      window.removeEventListener("documentUploaded", handleDocumentUploaded);
    };
  }, [queryClient]);

  const handleDelete = (id: string): void => {
    deleteDoc(id);
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleDownload = (doc: DocumentData): void => {
    downloadDoc(doc);
  };

  const handleViewDetails = (doc: DocumentData): void => {
    setSelectedDocument(doc);
    setShowDetails(true);
  };

  const handlePreview = (doc: DocumentData): void => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const closeDetails = (): void => {
    setShowDetails(false);
    setSelectedDocument(null);
  };

  const closePreview = (): void => {
    setShowPreview(false);
    setSelectedDocument(null);
  };

  const confirmDelete = (doc: DocumentData): void => {
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = (): void => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const { stats } = statsData || {};
  const { documents } = documentsData || {};

  if (isLoading) {
    return (
      <Paper shadow="xs" radius="md" p="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>
            Documents
          </Title>
        </Group>
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      </Paper>
    );
  }

  return (
    <Paper
      shadow="xs"
      radius="md"
      p="md"
      style={{ maxHeight: "100vh", overflowY: "auto" }}
    >
      <Group justify="space-between" mb="md">
        <Title order={4}>
          Documents
        </Title>
        <Button
          onClick={() => {
            refetch();
            refetchDocuments();
          }}
          variant="text"
          color="gray"
          size="sm"
          disabled={isFetching}
          leftIcon={<IconRefresh size={16} aria-hidden="true" />}
        >
          Refresh
        </Button>
      </Group>

      {(statsError || documentsError) && (
        <Alert
          icon={<IconAlertTriangle size={20} aria-hidden="true" />}
          color="red"
          mb="md"
        >
          {statsError instanceof Error
            ? statsError.message
            : documentsError instanceof Error
              ? documentsError.message
              : "Failed to load documents"}
        </Alert>
      )}

      {stats?.exists ? (
        <Stack gap="sm" mb="md">
          <Paper bg="gray.0" radius="md" p="sm">
            <Group gap="sm">
              <IconChartBar size={24} aria-hidden="true" />
              <Box style={{ flex: 1 }}>
                <Text fw={600} size="sm">
                  {stats.count} Chunks
                </Text>
                <Text c="dimmed" size="xs">
                  From {documents?.length || 0} documents
                </Text>
              </Box>
            </Group>
          </Paper>
          <Paper bg="gray.0" radius="md" p="sm">
            <Group gap="sm">
              <IconFolder size={24} aria-hidden="true" />
              <Box style={{ flex: 1 }}>
                <Text fw={600} size="sm">
                  {stats.collectionName || "documents"}
                </Text>
                <Text c="dimmed" size="xs">
                  Active collection
                </Text>
              </Box>
            </Group>
          </Paper>
        </Stack>
      ) : (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconInbox color="blue" size={32} aria-hidden="true" />
            <Text c="dimmed">No documents indexed yet</Text>
            <Text c="dimmed" size="sm">
              Upload documents to get started
            </Text>
          </Stack>
        </Center>
      )}

      {documents && documents.length > 0 && (
        <Paper withBorder my="md" data-testid="document-list">
          {isFetching && !isLoading ? (
            <Center py="xl">
              <Text c="dimmed">Refreshing...</Text>
            </Center>
          ) : (
            <Stack gap={0}>
              {documents.map((doc: DocumentData, index: number) => (
                <Box key={doc.id}>
                  <Group p="sm" justify="space-between" wrap="nowrap">
                    <Group
                      gap="sm"
                      wrap="nowrap"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Box style={{ flexShrink: 0 }}>
                        {getFileIcon(doc.file_type)}
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={500} size="sm" truncate>
                          {doc.file_name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge color="violet" size="xs" variant="light">
                            {doc.file_type}
                          </Badge>
                          <Text c="dimmed" size="xs">
                            {formatDate(doc.upload_date)}
                          </Text>
                          {doc.chunk_count > 0 && (
                            <Text c="dimmed" size="xs">
                              {doc.chunk_count} chunk
                              {doc.chunk_count !== 1 ? "s" : ""}
                            </Text>
                          )}
                        </Group>
                      </Box>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <IconButton
                        icon={<IconInfoCircle size={20} aria-hidden="true" />}
                        ariaLabel={`View details for ${doc.file_name}`}
                        onClick={() => handleViewDetails(doc)}
                        color="gray"
                        size="sm"
                      />
                      <IconButton
                        icon={<IconEye size={20} aria-hidden="true" />}
                        ariaLabel={`Preview ${doc.file_name}`}
                        onClick={() => handlePreview(doc)}
                        color="gray"
                        size="sm"
                      />
                      {doc.can_download && (
                        <IconButton
                          icon={<IconDownload size={20} aria-hidden="true" />}
                          ariaLabel={`Download ${doc.file_name}`}
                          onClick={() => handleDownload(doc)}
                          color="gray"
                          size="sm"
                        />
                      )}
                      <IconButton
                        icon={<IconTrash size={20} aria-hidden="true" />}
                        ariaLabel={`Delete ${doc.file_name}`}
                        onClick={() => confirmDelete(doc)}
                        color="red"
                        data-testid="delete-document-button"
                        size="sm"
                      />
                    </Group>
                  </Group>
                  {index < documents.length - 1 && <Divider />}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      <ContentModal
        isOpen={showDetails}
        onClose={closeDetails}
        title="Document Details"
        size="medium"
        testId="details-modal"
      >
        {selectedDocument && (
          <Stack gap={0}>
            {[
              { label: "File Name", value: selectedDocument.file_name },
              { label: "File Type", value: selectedDocument.file_type },
              {
                label: "Upload Date",
                value: formatDateTime(selectedDocument.upload_date),
              },
              { label: "Chunks", value: String(selectedDocument.chunk_count) },
              ...(selectedDocument.file_size
                ? [{ label: "File Size", value: selectedDocument.file_size }]
                : []),
            ].map(({ label, value }, index, arr) => (
              <Group key={label} py="sm" justify="space-between" wrap="nowrap">
                <Text fw={500} c="dimmed" size="sm" style={{ flexShrink: 0 }}>
                  {label}:
                </Text>
                <Text
                  c="dimmed"
                  size="sm"
                  ta="right"
                  style={{ wordBreak: "break-word", flex: 1 }}
                >
                  {value}
                </Text>
                {index < arr.length - 1 && <Divider />}
              </Group>
            ))}
            {selectedDocument.can_download && (
              <Group py="sm" justify="space-between" wrap="nowrap">
                <Text fw={500} c="dimmed" size="sm" style={{ flexShrink: 0 }}>
                  Download:
                </Text>
                <Button
                  onClick={() => handleDownload(selectedDocument)}
                  variant="text"
                  size="small"
                >
                  Download file
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </ContentModal>

      <ContentModal
        isOpen={showPreview}
        onClose={closePreview}
        title="Document Preview"
        size="large"
        testId="preview-modal"
      >
        {selectedDocument && (
          <Stack>
            <Text fw={600} size="md" mb="xs">
              {selectedDocument.file_name}
            </Text>
            <ScrollArea
              h={400}
              style={{ background: "var(--mantine-color-gray-0)" }}
              type="auto"
            >
              <Paper bg="gray.0" withBorder p="md" radius="md">
                {previewLoading ? (
                  <Text c="dimmed" fs="italic">
                    Loading preview...
                  </Text>
                ) : previewContent ? (
                  <Code block>
                    {previewContent}
                  </Code>
                ) : (
                  <Text c="dimmed" fs="italic">
                    No content available for preview
                  </Text>
                )}
              </Paper>
            </ScrollArea>
          </Stack>
        )}
      </ContentModal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={() => {
          if (documentToDelete) {
            handleDelete(documentToDelete.id);
          }
        }}
        title="Confirm Delete"
        message={
          documentToDelete
            ? `Are you sure you want to delete "${documentToDelete.file_name}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        testId="delete-modal"
        confirmButtonProps={{ color: "red" }}
      />
    </Paper>
  );
}
