/**
 * Form Types
 * Type definitions for form-related components and utilities
 */

/**
 * Form field configuration
 */
export interface FormField<T = unknown> {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: T;
  options?: { value: T; label: string }[];
  validation?: (value: T) => string | null;
}

/**
 * Form state
 */
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Form submission result
 */
export interface FormSubmitResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
