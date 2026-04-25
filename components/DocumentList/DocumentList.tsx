"use client";

import { useState } from "react";
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
import { getFileIcon } from "./DocumentList.utils";
import { formatDate, formatDateTime } from "@/lib/utils/date.utils";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useGetDocument } from "@/lib/hooks/useGetDocument";
import { useDocumentDelete } from "@/lib/hooks/useDocumentDelete";
import { useDocumentDownload } from "@/lib/hooks/useDocumentDownload";
import type { DocumentEntry } from "@/lib/db/types";

export default function DocumentList() {
  const { mutate: downloadDoc } = useDocumentDownload();

  const {
    data: documentsData,
    isFetching,
    isLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments();

  const { mutate: deleteDocument } = useDocumentDelete();

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: previewDocumentData, isLoading: previewLoading } =
    useGetDocument(selectedDocument?.id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (id: string) => {
    deleteDocument(id);
    setShowDeleteConfirm(false);
    setSelectedDocument(null);
  };

  const handleDownload = (doc: DocumentEntry) => {
    downloadDoc(doc);
  };

  const handleViewDetails = (doc: DocumentEntry) => {
    setSelectedDocument(doc);
    setShowDetails(true);
  };

  const handlePreview = (doc: DocumentEntry) => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedDocument(null);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedDocument(null);
  };

  const confirmDelete = (doc: DocumentEntry) => {
    setSelectedDocument(doc);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedDocument(null);
  };

  const { documents, stats } = documentsData || {};

  if (isLoading) {
    return (
      <Paper shadow="xs" radius="md" p="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Documents</Title>
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
        <Title order={4}>Documents</Title>
        <Button
          onClick={refetchDocuments}
          variant="text"
          color="gray"
          size="sm"
          disabled={isFetching}
          leftIcon={<IconRefresh size={16} aria-hidden="true" />}
        >
          Refresh
        </Button>
      </Group>

      {documentsError && (
        <Alert
          icon={<IconAlertTriangle size={20} aria-hidden="true" />}
          color="red"
          mb="md"
        >
          {documentsError instanceof Error
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
              {documents.map((doc, index) => (
                <Box key={doc.id}>
                  <Group p="sm" justify="space-between" wrap="nowrap">
                    <Group
                      gap="sm"
                      wrap="nowrap"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Box style={{ flexShrink: 0 }}>
                        {getFileIcon(doc.fileType)}
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={500} size="sm" truncate>
                          {doc.filename}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge color="violet" size="xs" variant="light">
                            {doc.fileType}
                          </Badge>
                          <Text c="dimmed" size="xs">
                            {formatDate(doc.uploadDate)}
                          </Text>
                          {(doc.chunkCount || 0) > 0 && (
                            <Text c="dimmed" size="xs">
                              {doc.chunkCount} chunk
                              {doc.chunkCount !== 1 ? "s" : ""}
                            </Text>
                          )}
                        </Group>
                      </Box>
                    </Group>
                    <Group gap={4} wrap="nowrap">
                      <IconButton
                        icon={<IconInfoCircle size={20} aria-hidden="true" />}
                        ariaLabel={`View details for ${doc.filename}`}
                        onClick={() => handleViewDetails(doc)}
                        color="gray"
                        size="sm"
                      />
                      <IconButton
                        icon={<IconEye size={20} aria-hidden="true" />}
                        ariaLabel={`Preview ${doc.filename}`}
                        onClick={() => handlePreview(doc)}
                        color="gray"
                        size="sm"
                      />
                      <IconButton
                        icon={<IconDownload size={20} aria-hidden="true" />}
                        ariaLabel={`Download ${doc.filename}`}
                        onClick={() => handleDownload(doc)}
                        color="gray"
                        size="sm"
                      />
                      <IconButton
                        icon={<IconTrash size={20} aria-hidden="true" />}
                        ariaLabel={`Delete ${doc.filename}`}
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
              { label: "File Name", value: selectedDocument.filename },
              { label: "File Type", value: selectedDocument.fileType },
              {
                label: "Upload Date",
                value: formatDateTime(selectedDocument.uploadDate),
              },
              { label: "Chunks", value: String(selectedDocument.chunkCount) },
              { label: "File Size", value: selectedDocument.fileSize },
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
              {selectedDocument.filename}
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
                ) : previewDocumentData?.content ? (
                  <Code block>{previewDocumentData.content}</Code>
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
          if (selectedDocument?.id) handleDelete(selectedDocument.id);
        }}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${selectedDocument?.filename || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        testId="delete-modal"
        confirmButtonProps={{ color: "red" }}
      />
    </Paper>
  );
}
