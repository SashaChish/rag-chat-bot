import type { ReactNode } from "react";
import type { ButtonProps as MantineButtonProps } from "@mantine/core";

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonColor = "primary" | "danger" | "success" | "default";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends MantineButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  color?: ButtonColor;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick: () => void;
}
