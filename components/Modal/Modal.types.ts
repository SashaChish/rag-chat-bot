/**
 * Modal Component Types
 * Type definitions specific to the Modal component
 */

/**
 * Modal variant types
 */
export type ModalVariant = 'default' | 'danger' | 'warning' | 'info';

/**
 * Modal state interface
 */
export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
}
