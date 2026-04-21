import {
  DocumentIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { DocumentTextIcon as DocumentTextIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils/cn';

interface FileIconProps {
  className?: string;
}

export function DefaultFileIcon({ className }: FileIconProps) {
  return (
    <DocumentIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}

export function PdfFileIcon({ className }: FileIconProps) {
  return (
    <DocumentTextIconSolid
      className={cn('w-5 h-5 text-red-600', className)}
      aria-hidden="true"
    />
  );
}

export function DocxFileIcon({ className }: FileIconProps) {
  return (
    <DocumentIcon
      className={cn('w-5 h-5 text-blue-600', className)}
      aria-hidden="true"
    />
  );
}

export function MarkdownFileIcon({ className }: FileIconProps) {
  return (
    <DocumentTextIcon
      className={cn('w-5 h-5 text-zinc-600', className)}
      aria-hidden="true"
    />
  );
}

export function TextFileIcon({ className }: FileIconProps) {
  return (
    <DocumentIcon
      className={cn('w-5 h-5 text-zinc-500', className)}
      aria-hidden="true"
    />
  );
}
