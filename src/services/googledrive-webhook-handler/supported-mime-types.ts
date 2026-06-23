export const SUPPORTED_RAG_MIME_TYPES = [
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
] as const;

export function isSupportedRagMimeType(mimeType: string): boolean {
  return (SUPPORTED_RAG_MIME_TYPES as readonly string[]).includes(mimeType);
}
