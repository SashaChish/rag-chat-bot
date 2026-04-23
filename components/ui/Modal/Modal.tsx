"use client";

import { Modal, Group } from "@mantine/core";
import { Button } from "../Button";
import type {
  ConfirmModalProps,
  ContentModalProps,
  ModalVariant,
} from "./Modal.types";

const variantBorderColors: Record<ModalVariant, string> = {
  default: "transparent",
  danger: "var(--mantine-color-red-6)",
  warning: "var(--mantine-color-amber-5)",
  success: "var(--mantine-color-green-5)",
};

const sizeMap: Record<NonNullable<ContentModalProps["size"]>, number> = {
  small: 400,
  medium: 500,
  large: 700,
};

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  testId = "confirm-modal",
  confirmButtonProps,
}: ConfirmModalProps) {
  const borderColor = variantBorderColors[variant];

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size={400}
      centered
      closeOnClickOutside
      closeOnEscape
      data-testid={testId}
      styles={{
        body: {
          borderLeft:
            borderColor !== "transparent"
              ? `4px solid ${borderColor}`
              : undefined,
          paddingLeft:
            borderColor !== "transparent"
              ? "calc(var(--mantine-spacing-md) - 4px)"
              : undefined,
        },
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--mantine-color-gray-6)",
          fontSize: "15px",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      <Group justify="flex-end" gap="sm" mt="md">
        <Button variant="outlined" color="gray" onClick={onClose}>
          {cancelText}
        </Button>
        <Button {...confirmButtonProps} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
}

function ContentModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  size = "medium",
  testId = "content-modal",
}: ContentModalProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size={sizeMap[size]}
      centered
      closeOnClickOutside
      closeOnEscape
      className={className}
      data-testid={testId}
    >
      <div className={contentClassName}>{children}</div>
    </Modal>
  );
}

export { ConfirmModal, ContentModal };
