import { IconChartBar, IconFolder, IconInbox, IconMessageChatbot, IconFile, IconSparkles } from '@tabler/icons-react';

interface UIIconProps {
  className?: string;
}

export function StatsIcon({ className }: UIIconProps) {
  return <IconChartBar size={24} className={className} aria-hidden="true" />;
}

export function StorageIcon({ className }: UIIconProps) {
  return <IconFolder size={24} className={className} aria-hidden="true" />;
}

export function EmptyStateIcon({ className }: UIIconProps) {
  return <IconInbox size={32} className={className} aria-hidden="true" />;
}

export function ChatEmptyIcon({ className }: UIIconProps) {
  return <IconMessageChatbot size={64} className={className} aria-hidden="true" />;
}

export function UploadIcon({ className }: UIIconProps) {
  return <IconFile size={48} className={className} aria-hidden="true" />;
}

export function RobotIcon({ className }: UIIconProps) {
  return <IconSparkles size={40} className={className} aria-hidden="true" />;
}
