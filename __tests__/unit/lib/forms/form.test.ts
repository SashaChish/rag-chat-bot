import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateField,
  validateForm,
  initializeFormState,
  getFormData,
} from '@/lib/forms/form.utils';
import type { FormField } from '@/lib/forms/form.types';

describe('Form Utils', () => {
  describe('validateField', () => {
    it('should return error for required field with empty string', () => {
      const field: FormField<string> = {
        name: 'username',
        type: 'text',
        required: true,
      };
      const result = validateField(field, '');
      expect(result).toContain('is required');
    });

    it('should return null for required field with value', () => {
      const field: FormField<string> = {
        name: 'username',
        type: 'text',
        required: true,
      };
      const result = validateField(field, 'test');
      expect(result).toBeNull();
    });

    it('should return null for optional field with empty string', () => {
      const field: FormField<string> = {
        name: 'username',
        type: 'text',
        required: false,
      };
      const result = validateField(field, '');
      expect(result).toBeNull();
    });

    it('should return error for invalid email format', () => {
      const field: FormField<string> = {
        name: 'email',
        type: 'email',
        required: true,
      };
      const result = validateField(field, 'invalid-email');
      expect(result).toContain('valid email address');
    });

    it('should return null for valid email format', () => {
      const field: FormField<string> = {
        name: 'email',
        type: 'email',
        required: true,
      };
      const result = validateField(field, 'test@example.com');
      expect(result).toBeNull();
    });

    it('should use custom validation function', () => {
      const field: FormField<string> = {
        name: 'age',
        type: 'text',
        required: true,
        validation: value => (parseInt(value as string) < 18 ? 'Must be at least 18' : null),
      };
      const result = validateField(field, '17');
      expect(result).toBe('Must be at least 18');
    });

    it('should use label in error message', () => {
      const field: FormField<string> = {
        name: 'username',
        type: 'text',
        required: true,
        label: 'Username',
      };
      const result = validateField(field, '');
      expect(result).toBe('Username is required');
    });

    it('should use name in error message when label not provided', () => {
      const field: FormField<string> = {
        name: 'username',
        type: 'text',
        required: true,
      };
      const result = validateField(field, '');
      expect(result).toBe('username is required');
    });
  });

  describe('validateForm', () => {
    it('should return valid result for valid form', () => {
      const fields: FormField<string>[] = [
        { name: 'username', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ];
      const values = { username: 'test', email: 'test@example.com' };
      const result = validateForm(fields, values);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return invalid result for invalid form', () => {
      const fields: FormField<string>[] = [
        { name: 'username', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ];
      const values = { username: '', email: 'invalid' };
      const result = validateForm(fields, values);
      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(2);
    });

    it('should include all errors in result', () => {
      const fields: FormField<string>[] = [
        { name: 'username', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ];
      const values = { username: '', email: '' };
      const result = validateForm(fields, values);
      expect(result.errors.username).toBeTruthy();
      expect(result.errors.email).toBeTruthy();
    });

    it('should handle empty fields array', () => {
      const result = validateForm([], {});
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('initializeFormState', () => {
    it('should initialize form state with default values', () => {
      const fields = [
        { name: 'username', type: 'text' as const, defaultValue: '' },
        { name: 'email', type: 'email' as const, defaultValue: '' },
      ];
      const result = initializeFormState(fields);
      const values = result.values as unknown as { username: string; email: string };
      expect(values).toEqual({ username: '', email: '' });
      expect(result.errors).toEqual({});
      expect(result.touched).toEqual({});
      expect(result.isSubmitting).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it('should initialize with provided default values', () => {
      const fields = [
        { name: 'username', type: 'text' as const, defaultValue: 'default' },
        { name: 'email', type: 'email' as const, defaultValue: 'test@example.com' },
      ];
      const result = initializeFormState(fields);
      const values = result.values as unknown as { username: string; email: string };
      expect(values.username).toBe('default');
      expect(values.email).toBe('test@example.com');
    });

    it('should handle empty fields array', () => {
      const result = initializeFormState([]);
      const values = result.values as unknown as Record<string, unknown>;
      expect(values).toEqual({});
      expect(result.errors).toEqual({});
      expect(result.touched).toEqual({});
      expect(result.isSubmitting).toBe(false);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getFormData', () => {
    let formElement: HTMLFormElement;

    beforeEach(() => {
      formElement = document.createElement('form');
      document.body.appendChild(formElement);
    });

    afterEach(() => {
      document.body.removeChild(formElement);
    });

    it('should extract form values', () => {
      const input1 = document.createElement('input');
      input1.name = 'username';
      input1.value = 'test';
      const input2 = document.createElement('input');
      input2.name = 'email';
      input2.value = 'test@example.com';

      formElement.appendChild(input1);
      formElement.appendChild(input2);

      const result = getFormData(formElement);
      expect(result).toEqual({ username: 'test', email: 'test@example.com' });
    });

    it('should handle empty form', () => {
      const result = getFormData(formElement);
      expect(result).toEqual({});
    });

    it('should handle multiple values with same name', () => {
      const input1 = document.createElement('input');
      input1.name = 'tags';
      input1.value = 'tag1';
      const input2 = document.createElement('input');
      input2.name = 'tags';
      input2.value = 'tag2';

      formElement.appendChild(input1);
      formElement.appendChild(input2);

      const result = getFormData(formElement);
      expect(result).toHaveProperty('tags');
    });
  });
});
