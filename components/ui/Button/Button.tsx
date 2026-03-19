'use client';

import { forwardRef } from 'react';
import type { ButtonProps } from './Button.types';
import { getButtonClasses } from './Button.utils';

const Spinner = (): JSX.Element => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'filled',
      color = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref,
  ): JSX.Element => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={getButtonClasses(
          variant,
          color,
          size,
          fullWidth,
          isDisabled,
          className,
        )}
        {...props}
      >
        {loading ? <Spinner /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
