import type { ReactNode } from "react";
import type { ButtonProps } from "../Button";

export type ModalVariant = "default" | "danger" | "warning" | "success";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonProps?: ButtonProps;
  variant?: ModalVariant;
  testId?: string;
}

export interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "small" | "medium" | "large";
  testId?: string;
}
