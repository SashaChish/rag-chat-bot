import { IconFile, IconFileText, IconFileTypePdf } from '@tabler/icons-react';

interface FileIconProps {
  className?: string;
}

export function DefaultFileIcon({ className }: FileIconProps) {
  return <IconFile size={20} className={className} aria-hidden="true" />;
}

export function PdfFileIcon({ className }: FileIconProps) {
  return <IconFileTypePdf size={20} className={className} aria-hidden="true" />;
}

export function DocxFileIcon({ className }: FileIconProps) {
  return <IconFile size={20} className={className} aria-hidden="true" />;
}

export function MarkdownFileIcon({ className }: FileIconProps) {
  return <IconFileText size={20} className={className} aria-hidden="true" />;
}

export function TextFileIcon({ className }: FileIconProps) {
  return <IconFile size={20} className={className} aria-hidden="true" />;
}
