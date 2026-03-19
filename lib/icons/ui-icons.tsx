import {
  ChartBarIcon,
  FolderIcon,
  InboxArrowDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

interface UIIconProps {
  className?: string;
}

export function StatsIcon({ className }: UIIconProps): JSX.Element {
  return (
    <ChartBarIcon
      className={cn('w-6 h-6 text-violet-500', className)}
      aria-hidden="true"
    />
  );
}

export function StorageIcon({ className }: UIIconProps): JSX.Element {
  return (
    <FolderIcon
      className={cn('w-6 h-6 text-violet-500', className)}
      aria-hidden="true"
    />
  );
}

export function EmptyStateIcon({ className }: UIIconProps): JSX.Element {
  return (
    <InboxArrowDownIcon
      className={cn('w-8 h-8 text-zinc-400', className)}
      aria-hidden="true"
    />
  );
}

export function ChatEmptyIcon({ className }: UIIconProps): JSX.Element {
  return (
    <ChatBubbleLeftRightIcon
      className={cn('w-16 h-16 text-zinc-300', className)}
      aria-hidden="true"
    />
  );
}

export function UploadIcon({ className }: UIIconProps): JSX.Element {
  return (
    <DocumentIcon
      className={cn('w-12 h-12 text-zinc-400', className)}
      aria-hidden="true"
    />
  );
}

export function RobotIcon({ className }: UIIconProps): JSX.Element {
  return (
    <SparklesIcon
      className={cn('w-10 h-10 text-violet-500', className)}
      aria-hidden="true"
    />
  );
}
