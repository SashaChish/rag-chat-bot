import { IconRefresh, IconInfoCircle, IconEye, IconDownload, IconTrash } from '@tabler/icons-react';

interface ActionIconProps {
  className?: string;
}

export function RefreshIcon({ className }: ActionIconProps) {
  return <IconRefresh size={16} className={className} aria-hidden="true" />;
}

export function InfoIcon({ className }: ActionIconProps) {
  return <IconInfoCircle size={20} className={className} aria-hidden="true" />;
}

export function PreviewIcon({ className }: ActionIconProps) {
  return <IconEye size={20} className={className} aria-hidden="true" />;
}

export function DownloadIcon({ className }: ActionIconProps) {
  return <IconDownload size={20} className={className} aria-hidden="true" />;
}

export function DeleteIcon({ className }: ActionIconProps) {
  return <IconTrash size={20} className={className} aria-hidden="true" />;
}
