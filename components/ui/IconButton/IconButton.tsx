'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import type { IconButtonProps, IconButtonColor, IconButtonSize } from './IconButton.types';

const sizeClasses: Record<IconButtonSize, string> = {
  small: 'min-w-8 h-8 text-sm',
  medium: 'min-w-10 h-10 text-base',
};

const colorClasses: Record<IconButtonColor, string> = {
  default: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
  primary: 'bg-primary-100 text-primary-600 hover:bg-primary-200',
  danger: 'bg-danger-50 text-danger-800 hover:bg-danger-100',
};

const Spinner = () => (
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

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      color = 'default',
      size = 'small',
      loading = false,
      disabled,
      className,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={cn(
          'flex items-center justify-center border-none rounded-md cursor-pointer transition-all',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:scale-105',
          sizeClasses[size],
          colorClasses[color],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner /> : icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
