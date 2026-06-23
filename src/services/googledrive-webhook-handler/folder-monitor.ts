import { logger } from '../../utils/logger';
import type { GoogleDriveWebhookContext } from './context';
import type { DriveFileRef } from './types';

export async function isFileInMonitoredFolder(
  ctx: GoogleDriveWebhookContext,
  file: DriveFileRef
): Promise<boolean> {
  try {
    if (!file.parents || file.parents.length === 0) {
      return false;
    }

    for (const parentId of file.parents) {
      if (ctx.monitoredFolders.has(parentId)) {
        return true;
      }

      const ancestorMonitored = await isAncestorMonitored(ctx, parentId);
      if (ancestorMonitored) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('❌ 監視対象フォルダ判定エラー', {
      fileId: file.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export async function isAncestorMonitored(
  ctx: GoogleDriveWebhookContext,
  folderId: string
): Promise<boolean> {
  try {
    const folder = await ctx.drive.files.get({
      fileId: folderId,
      fields: 'parents',
    });

    if (!folder.data.parents) {
      return false;
    }

    for (const parentId of folder.data.parents) {
      if (ctx.monitoredFolders.has(parentId)) {
        return true;
      }

      const depth = 5;
      if (depth > 0) {
        return isAncestorMonitored(ctx, parentId);
      }
    }

    return false;
  } catch (error) {
    logger.debug('⚠️ 祖先フォルダ取得エラー', {
      folderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
