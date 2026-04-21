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

export function RefreshIcon({ className }: ActionIconProps) {
  return (
    <ArrowPathIcon
      className={cn('w-4 h-4', className)}
      aria-hidden="true"
    />
  );
}

export function InfoIcon({ className }: ActionIconProps) {
  return (
    <InformationCircleIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function PreviewIcon({ className }: ActionIconProps) {
  return (
    <EyeIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function DownloadIcon({ className }: ActionIconProps) {
  return (
    <ArrowDownTrayIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function DeleteIcon({ className }: ActionIconProps) {
  return (
    <TrashIcon
      className={cn('w-5 h-5', className)}
      aria-hidden="true"
    />
  );
}
