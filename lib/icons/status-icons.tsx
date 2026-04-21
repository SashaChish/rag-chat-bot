import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils/cn';

interface StatusIconProps {
  className?: string;
}

export function SuccessIcon({ className }: StatusIconProps) {
  return (
    <CheckCircleIcon
      className={cn('w-5 h-5 text-emerald-500', className)}
      aria-hidden="true"
    />
  );
}

export function ErrorIcon({ className }: StatusIconProps) {
  return (
    <XCircleIcon
      className={cn('w-5 h-5 text-red-500', className)}
      aria-hidden="true"
    />
  );
}

export function WarningIcon({ className }: StatusIconProps) {
  return (
    <ExclamationTriangleIcon
      className={cn('w-5 h-5 text-amber-500', className)}
      aria-hidden="true"
    />
  );
}
