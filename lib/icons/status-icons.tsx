import { IconCircleCheck, IconCircleX, IconAlertTriangle } from '@tabler/icons-react';

interface StatusIconProps {
  className?: string;
}

export function SuccessIcon({ className }: StatusIconProps) {
  return <IconCircleCheck size={20} className={className} aria-hidden="true" />;
}

export function ErrorIcon({ className }: StatusIconProps) {
  return <IconCircleX size={20} className={className} aria-hidden="true" />;
}

export function WarningIcon({ className }: StatusIconProps) {
  return <IconAlertTriangle size={20} className={className} aria-hidden="true" />;
}
