import { IconFileTypePdf, IconFile, IconFileText } from "@tabler/icons-react";

export function getFileIcon(fileType: string) {
  const iconMap: Record<string, React.ReactElement> = {
    PDF: <IconFileTypePdf size={20} aria-hidden="true" />,
    TEXT: <IconFile size={20} aria-hidden="true" />,
    MARKDOWN: <IconFileText size={20} aria-hidden="true" />,
    DOCX: <IconFile size={20} aria-hidden="true" />,
  };
  return iconMap[fileType] || <IconFile size={20} aria-hidden="true" />;
}
