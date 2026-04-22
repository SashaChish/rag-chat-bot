"use client";

import { forwardRef } from "react";
import { ActionIcon } from "@mantine/core";
import type { IconButtonProps } from "./IconButton.types";

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, ariaLabel, loading = false, disabled, className, ...props },
    ref,
  ) => {
    return (
      <ActionIcon
        ref={ref}
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

IconButton.displayName = "IconButton";

export default IconButton;
