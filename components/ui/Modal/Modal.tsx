"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import type {
  ConfirmModalProps,
  ContentModalProps,
  ModalVariant,
} from "./Modal.types";

const variantStyles: Record<ModalVariant, string> = {
  default: "",
  danger: "border-l-4 border-danger-600",
  warning: "border-l-4 border-warning-500",
  success: "border-l-4 border-success-500",
};

const sizeStyles: Record<NonNullable<ContentModalProps["size"]>, string> = {
  small: "max-w-[400px]",
  medium: "max-w-[500px]",
  large: "max-w-[700px]",
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
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return (): void => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmColor = variant === "danger" ? "danger" : "primary";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
      data-testid={`${testId}-overlay`}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] max-w-[400px] w-[90%] animate-[slideUp_0.2s_ease-out]",
          variantStyles[variant],
        )}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        data-testid={`${testId}-content`}
      >
        <div className="flex justify-between items-center py-5 px-5 border-b border-zinc-200">
          <h3 className="m-0 text-lg font-semibold text-zinc-900">{title}</h3>
          <IconButton
            icon={<span className="text-lg">×</span>}
            aria-label="Close modal"
            onClick={onClose}
            color="default"
            size="small"
          />
        </div>
        <div className="py-5 px-5">
          <p className="m-0 text-zinc-600 text-[15px] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-3 py-4 px-5 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
          <Button variant="outlined" color="default" onClick={onClose}>
            {cancelText}
          </Button>
          <Button color={confirmColor} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return (): void => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
      data-testid={`${testId}-overlay`}
    >
      <div
        className={cn(
          "bg-white rounded-xl shadow-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]",
          sizeStyles[size],
          className,
        )}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        data-testid={`${testId}-content`}
      >
        <div className="flex justify-between items-center py-4 px-5 border-b border-zinc-200">
          <h3 className="m-0 text-zinc-900 text-lg">{title}</h3>
          <IconButton
            icon={<span className="text-sm">✕</span>}
            aria-label="Close modal"
            onClick={onClose}
            color="default"
            size="small"
          />
        </div>
        <div className={cn("py-5 px-5 overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { ConfirmModal, ContentModal };
