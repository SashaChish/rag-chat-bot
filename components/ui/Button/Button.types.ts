import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'text';
export type ButtonColor = 'primary' | 'danger' | 'success' | 'default';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
