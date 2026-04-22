import type { ReactNode } from "react";
import type { ButtonProps as MantineButtonProps } from "@mantine/core";

export interface ButtonProps extends MantineButtonProps {
  children?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
}
