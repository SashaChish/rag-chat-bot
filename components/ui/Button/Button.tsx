"use client";

import { forwardRef } from "react";
import { Button as MantineButton } from "@mantine/core";
import type { ButtonProps } from "./Button.types";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "filled",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <MantineButton
        ref={ref}
        disabled={disabled || loading}
        loading={loading}
        fullWidth={fullWidth}
        leftSection={leftIcon}
        rightSection={rightIcon}
        className={className}
        variant={variant}
        {...props}
      >
        {children}
      </MantineButton>
    );
  },
);

Button.displayName = "Button";

export default Button;
