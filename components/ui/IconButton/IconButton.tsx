'use client';

import { forwardRef } from 'react';
import { ActionIcon } from '@mantine/core';
import type { IconButtonProps, IconButtonColor, IconButtonSize } from './IconButton.types';

const sizeMap: Record<IconButtonSize, string> = {
  small: 'sm',
  medium: 'md',
};

const colorConfig: Record<IconButtonColor, { color: string; variant: string }> = {
  default: { color: 'gray', variant: 'subtle' },
  primary: { color: 'violet', variant: 'subtle' },
  danger: { color: 'red', variant: 'subtle' },
};

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
    const { color: mantineColor, variant } = colorConfig[color];

    return (
      <ActionIcon
        ref={ref}
        type={type}
        variant={variant}
        color={mantineColor}
        size={sizeMap[size]}
        loading={loading}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        className={className}
        {...props}
      >
        {icon}
      </ActionIcon>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
