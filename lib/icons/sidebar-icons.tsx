import { IconMenu2, IconX } from '@tabler/icons-react';

interface SidebarIconProps {
  className?: string;
}

export function SidebarOpenIcon({ className }: SidebarIconProps) {
  return <IconMenu2 size={20} className={className} aria-hidden="true" />;
}

export function SidebarCloseIcon({ className }: SidebarIconProps) {
  return <IconX size={20} className={className} aria-hidden="true" />;
}
