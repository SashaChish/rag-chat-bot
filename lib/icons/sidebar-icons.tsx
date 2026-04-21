import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

interface SidebarIconProps {
  className?: string;
}

export function SidebarOpenIcon({ className }: SidebarIconProps) {
  return (
    <Bars3Icon
      className={cn('w-5 h-5', className)}
      aria-hidden="true"
    />
  );
}

export function SidebarCloseIcon({ className }: SidebarIconProps) {
  return (
    <XMarkIcon
      className={cn('w-5 h-5', className)}
      aria-hidden="true"
    />
  );
}
