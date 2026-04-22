"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paper,
  Progress,
  Alert,
  Group,
  Stack,
  Text,
  Center,
  Loader,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
  IconUpload,
  IconAlertCircle,
  IconCircleCheck,
  IconX,
} from "@tabler/icons-react";
import type { DocumentUploadResponse as APIUploadResponse } from "../../lib/types/api";
import { getSupportedMimeTypes } from "./Upload.utils";
import { FILE_EXTENSIONS } from "@/lib/constants";

export default function Upload() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    filename: string;
    chunksProcessed?: number;
  } | null>(null);
  const openRef = useRef<() => void>(null);

  const { mutate: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: async (file: File): Promise<APIUploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      return response.json();
    },
    onMutate: () => {
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return { progressInterval };
    },
    onSuccess: (data, _file, context) => {
      if (context?.progressInterval) {
        clearInterval(context.progressInterval);
      }
      setUploadProgress(100);

      setSuccess({
        message: data.message,
        filename: data.filename,
        chunksProcessed: data.chunksProcessed,
      });

      setTimeout(() => setSuccess(null), 3000);

      window.dispatchEvent(
        new CustomEvent("documentUploaded", { detail: data }),
      );

      queryClient.invalidateQueries({ queryKey: ["documents-stats"] });
      queryClient.invalidateQueries({ queryKey: ["documents-list"] });

      window.dispatchEvent(
        new CustomEvent("documentUploaded", { detail: data }),
      );
    },
    onError: (error) => {
      setUploadProgress(0);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    },
    onSettled: () => {
      setUploadProgress(0);
    },
  });

  const handleFileUpload = useCallback(
    (file: File): void => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (!FILE_EXTENSIONS.includes(ext)) {
        setError(
          "Unsupported file format. Supported formats: PDF, TEXT, MARKDOWN, DOCX",
        );
        setTimeout(() => setError(null), 5000);
        return;
      }

      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(
          `File size exceeds ${maxSizeMB}MB limit. Your file is ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB`,
        );
        setTimeout(() => setError(null), 5000);
        return;
      }

      uploadFile(file);
    },
    [uploadFile],
  );

  const formatsLabel = "PDF, TEXT, MARKDOWN, DOCX";

  return (
    <Paper shadow="xs" radius="md" p="lg">
      {isUploading ? (
        <Stack align="center" gap="sm" py="xl">
          <Loader size="lg" />
          <Text>Uploading and indexing...</Text>
          <Progress value={uploadProgress} w="100%" size="sm" color="violet" />
        </Stack>
      ) : (
        <Dropzone
          openRef={openRef}
          onDrop={(files) => {
            if (files.length > 0) {
              handleFileUpload(files[0]);
            }
          }}
          onReject={() => {
            setError("File type not supported");
            setTimeout(() => setError(null), 5000);
          }}
          accept={getSupportedMimeTypes()}
          disabled={isUploading}
          py="xl"
          styles={{
            root: { cursor: "pointer" },
          }}
        >
          <Group justify="center" gap="xl" style={{ pointerEvents: "none" }}>
            <Dropzone.Idle>
              <Stack align="center" gap="xs">
                <Center>
                  <IconUpload
                    size={48}
                    stroke={1.5}
                    color="var(--mantine-color-gray-4)"
                  />
                </Center>
                <Text fw={600} size="lg">
                  Upload a Document
                </Text>
                <Text c="dimmed" size="sm">
                  Drag and drop a file here, or click to browse
                </Text>
                <Text c="dimmed" size="xs">
                  Supported formats: {formatsLabel} (max 10MB)
                </Text>
              </Stack>
            </Dropzone.Idle>
            <Dropzone.Accept>
              <Stack align="center" gap="xs">
                <IconUpload
                  size={48}
                  stroke={1.5}
                  color="var(--mantine-color-violet-6)"
                />
                <Text c="violet" size="lg" fw={600}>
                  Drop file here
                </Text>
              </Stack>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <Stack align="center" gap="xs">
                <IconX
                  size={48}
                  stroke={1.5}
                  color="var(--mantine-color-red-6)"
                />
                <Text c="red" size="lg" fw={600}>
                  File type not supported
                </Text>
              </Stack>
            </Dropzone.Reject>
          </Group>
        </Dropzone>
      )}

      {error && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          color="red"
          mt="md"
          data-testid="upload-error"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          icon={<IconCircleCheck size={20} />}
          color="green"
          mt="md"
          data-testid="upload-success"
        >
          {success.message}
          {success.chunksProcessed && (
            <Text component="span" c="dimmed" size="sm" ml={4}>
              ({success.chunksProcessed} chunks processed)
            </Text>
          )}
        </Alert>
      )}
    </Paper>
  );
}
