import { cn } from '@/lib/utils/cn';
import type { ButtonVariant, ButtonColor, ButtonSize } from './Button.types';

const sizeClasses: Record<ButtonSize, string> = {
  small: 'py-1.5 px-3 text-sm',
  medium: 'py-2.5 px-5 text-sm',
  large: 'py-3 px-6 text-base',
};

const variantClasses: Record<ButtonVariant, Record<ButtonColor, string>> = {
  filled: {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-300',
    success:
      'bg-success-600 text-white hover:bg-success-700 disabled:bg-success-300',
    default:
      'bg-zinc-600 text-white hover:bg-zinc-700 disabled:bg-zinc-400',
  },
  outlined: {
    primary:
      'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 disabled:border-primary-300 disabled:text-primary-300',
    danger:
      'bg-transparent border-2 border-danger-600 text-danger-600 hover:bg-danger-50 disabled:border-danger-300 disabled:text-danger-300',
    success:
      'bg-transparent border-2 border-success-600 text-success-600 hover:bg-success-50 disabled:border-success-300 disabled:text-success-300',
    default:
      'bg-transparent border-2 border-zinc-400 text-zinc-600 hover:bg-zinc-50 disabled:border-zinc-300 disabled:text-zinc-400',
  },
  text: {
    primary:
      'bg-transparent border-none text-primary-600 hover:bg-primary-50 disabled:text-primary-300',
    danger:
      'bg-transparent border-none text-danger-600 hover:bg-danger-50 disabled:text-danger-300',
    success:
      'bg-transparent border-none text-success-600 hover:bg-success-50 disabled:text-success-300',
    default:
      'bg-transparent border-none text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-400',
  },
};

export function getButtonClasses(
  variant: ButtonVariant,
  color: ButtonColor,
  size: ButtonSize,
  fullWidth: boolean,
  disabled: boolean,
  className?: string,
): string {
  return cn(
    'rounded-md font-medium cursor-pointer transition-colors inline-flex items-center justify-center gap-2',
    'disabled:cursor-not-allowed',
    sizeClasses[size],
    variantClasses[variant][color],
    fullWidth && 'w-full',
    disabled && 'cursor-not-allowed',
    className,
  );
}
