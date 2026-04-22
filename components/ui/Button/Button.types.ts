import type { ReactNode } from "react";
import type { ButtonProps as MantineButtonProps } from "@mantine/core";

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends MantineButtonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
}
