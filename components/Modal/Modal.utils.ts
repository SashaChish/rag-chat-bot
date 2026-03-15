/**
 * Modal Component Utilities
 * Helper functions specific to the Modal component
 */

import type { ModalVariant } from './Modal.types';

/**
 * Get modal CSS class based on variant
 */
export function getModalVariantClass(variant?: ModalVariant): string {
  return variant || 'default';
}

/**
 * Get confirm button text based on variant
 */
export function getConfirmButtonText(variant?: ModalVariant): string {
  switch (variant) {
    case 'danger':
      return 'Delete';
    case 'warning':
      return 'Proceed';
    case 'info':
      return 'OK';
    default:
      return 'Confirm';
  }
}

/**
 * Get cancel button text based on variant
 */
export function getCancelButtonText(variant?: ModalVariant): string {
  switch (variant) {
    case 'danger':
      return 'Keep';
    case 'warning':
      return 'Cancel';
    case 'info':
      return 'Close';
    default:
      return 'Cancel';
  }
}

/**
 * Check if modal should show close button
 */
export function shouldShowCloseButton(variant?: ModalVariant): boolean {
  return variant !== 'danger';
}

/**
 * Get modal ARIA label based on variant
 */
export function getModalAriaLabel(variant?: ModalVariant): string {
  switch (variant) {
    case 'danger':
      return 'Danger confirmation modal';
    case 'warning':
      return 'Warning modal';
    case 'info':
      return 'Information modal';
    default:
      return 'Confirmation modal';
  }
}
