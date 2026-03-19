import {
  ArrowPathIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

interface ActionIconProps {
  className?: string;
}

export function RefreshIcon({ className }: ActionIconProps): JSX.Element {
  return (
    <ArrowPathIcon
      className={cn('w-4 h-4', className)}
      aria-hidden="true"
    />
  );
}

export function InfoIcon({ className }: ActionIconProps): JSX.Element {
  return (
    <InformationCircleIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function PreviewIcon({ className }: ActionIconProps): JSX.Element {
  return (
    <EyeIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function DownloadIcon({ className }: ActionIconProps): JSX.Element {
  return (
    <ArrowDownTrayIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function DeleteIcon({ className }: ActionIconProps): JSX.Element {
  return (
    <TrashIcon
      className={cn('w-5 h-5', className)}
      aria-hidden="true"
    />
  );
}
