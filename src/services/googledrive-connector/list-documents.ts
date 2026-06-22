import { logger } from '../../utils/logger';
import { sanitizeFileName } from '../../utils/security';
import type { DocumentMetadata } from './types';

export const DEFAULT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'text/x-markdown',
];

export async function listDocuments(
  drive: any,
  folderId?: string,
  mimeTypes: string[] = [
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/x-markdown'
  ]
): Promise<DocumentMetadata[]> {
  try {
    logger.info('📋 GoogleDriveドキュメント一覧取得開始', { folderId, mimeTypes });

    // 一時的にMIMETypeフィルタを無効化して全ファイル取得
    const query = [
      folderId ? `'${folderId}' in parents` : null,
      'trashed = false'
    ].filter(Boolean).join(' and ');

    const response = await drive.files.list({
      q: query,
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });

    const documents: DocumentMetadata[] = response.data.files.map((file: any) => ({
      id: file.id,
      name: sanitizeFileName(file.name || ''),
      mimeType: file.mimeType,
      size: parseInt(file.size || '0'),
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink
    }));

    logger.info('✅ GoogleDriveドキュメント取得完了', { count: documents.length });
    return documents;

  } catch (error) {
    logger.error('❌ GoogleDriveドキュメント取得エラー', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}
