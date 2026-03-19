import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type IconButtonColor = 'default' | 'primary' | 'danger';
export type IconButtonSize = 'small' | 'medium';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  'aria-label': string;
  color?: IconButtonColor;
  size?: IconButtonSize;
  loading?: boolean;
}
