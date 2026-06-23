import { logger } from '../../utils/logger';
import type { GoogleDriveWebhookContext } from './context';
import type { DriveChangeEvent } from './types';

export async function getStartPageToken(ctx: GoogleDriveWebhookContext): Promise<string> {
  try {
    const response = await ctx.drive.changes.getStartPageToken();
    return response.data.startPageToken;
  } catch (error) {
    logger.error('❌ 開始ページトークン取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function getDriveChanges(
  ctx: GoogleDriveWebhookContext,
  pageToken?: string
): Promise<DriveChangeEvent[]> {
  try {
    const response = await ctx.drive.changes.list({
      pageToken: pageToken || (await getStartPageToken(ctx)),
      includeItemsFromAllDrives: false,
      supportsAllDrives: false,
      fields:
        'changes(changeType,removed,fileId,file(id,name,mimeType,parents,modifiedTime)),nextPageToken',
    });

    return response.data.changes || [];
  } catch (error) {
    logger.error('❌ Drive変更一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
