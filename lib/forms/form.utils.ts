/**
 * Form Utility Functions
 * Helper functions for form handling
 */

import type { FormField, FormState, FormValidationResult } from './form.types';

/**
 * Validate a form field
 */
export function validateField<T>(field: FormField<T>, value: T): string | null {
  // Required field validation
  if (field.required && (value === null || value === undefined || value === '')) {
    return `${field.label || field.name} is required`;
  }

  // Type-specific validation
  if (field.type === 'email' && typeof value === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  // Custom validation
  if (field.validation) {
    return field.validation(value);
  }

  return null;
}

/**
 * Validate an entire form
 */
export function validateForm<T>(fields: FormField<T>[], values: Record<string, T>): FormValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const field of fields) {
    const error = validateField(field, values[field.name]);
    if (error) {
      errors[field.name] = error;
      isValid = false;
    }
  }

  return { valid: isValid, errors };
}

/**
 * Initialize form state
 */
export function initializeFormState<T>(fields: FormField<T>[]): FormState<T> {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const touched: Record<string, boolean> = {};

  for (const field of fields) {
    values[field.name] = field.defaultValue;
  }

  return {
    values: values as T,
    errors,
    touched,
    isSubmitting: false,
    isValid: true,
  };
}

/**
 * Get form values as FormData object
 */
export function getFormData<T>(form: HTMLFormElement): T {
  const formData = new FormData(form);
  const values: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    values[key] = value;
  }

  return values as T;
}
