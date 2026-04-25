import { EXTENSION_TO_MIME, FILE_EXTENSIONS } from "@/lib/constants";

export function getSupportedMimeTypes(): string[] {
  return [
    ...new Set(
      FILE_EXTENSIONS.map((ext) => EXTENSION_TO_MIME[ext]).filter(Boolean),
    ),
  ];
}
