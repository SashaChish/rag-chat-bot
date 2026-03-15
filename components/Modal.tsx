"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";
import type { ModalProps } from "@/lib/types/components";

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ModalProps): JSX.Element | null {
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles[variant]}`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.confirmButton} ${styles[variant]}`}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}