import { logger } from '../../utils/logger';
import type { GoogleDriveWebhookContext } from './context';
import { getDriveChanges } from './change-fetcher';
import { isFileInMonitoredFolder } from './folder-monitor';
import { removeFileFromRag, syncFileToRag } from './rag-sync';
import { isSupportedRagMimeType } from './supported-mime-types';
import type { DriveChangeEvent, DriveFileRef, WebhookNotification } from './types';

export async function processWebhookNotification(
  ctx: GoogleDriveWebhookContext,
  notification: WebhookNotification,
  resourceState: string
): Promise<void> {
  logger.info('🔄 Webhook通知処理開始', {
    resourceState,
    resourceId: notification.resourceId,
  });

  switch (resourceState) {
    case 'sync':
      await handleSyncNotification(ctx, notification);
      break;
    case 'update':
      await handleUpdateNotification(ctx, notification);
      break;
    case 'remove':
      await handleRemoveNotification(ctx, notification);
      break;
    default:
      logger.info('ℹ️ 未処理の通知タイプ', { resourceState });
      break;
  }
}

async function handleSyncNotification(
  ctx: GoogleDriveWebhookContext,
  notification: WebhookNotification
): Promise<void> {
  logger.info('✅ Drive同期完了通知受信', {
    resourceId: notification.resourceId,
  });

  ctx.prometheusClient.recordDriveSyncEvent('completed', notification.resourceId);
}

async function handleUpdateNotification(
  ctx: GoogleDriveWebhookContext,
  notification: WebhookNotification
): Promise<void> {
  try {
    logger.info('📝 Drive更新通知処理開始', {
      resourceUri: notification.resourceUri,
    });

    const changes = await getDriveChanges(ctx, notification.resourceId);

    for (const change of changes) {
      if (change.removed) {
        await handleFileRemoval(ctx, change);
      } else if (change.file) {
        await handleFileUpdate(ctx, change.file);
      }
    }

    logger.info('✅ Drive更新通知処理完了', {
      changesProcessed: changes.length,
    });
  } catch (error) {
    logger.error('❌ Drive更新通知処理エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function handleRemoveNotification(
  ctx: GoogleDriveWebhookContext,
  notification: WebhookNotification
): Promise<void> {
  logger.info('🗑️ Drive削除通知処理', {
    resourceId: notification.resourceId,
  });

  ctx.prometheusClient.recordDriveSyncEvent('file_removed', notification.resourceId);
}

async function handleFileUpdate(
  ctx: GoogleDriveWebhookContext,
  file: DriveFileRef
): Promise<void> {
  try {
    logger.info('📝 ファイル更新処理開始', {
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
    });

    if (!isSupportedRagMimeType(file.mimeType)) {
      logger.debug('⏭️ 非対応ファイル形式', {
        fileName: file.name,
        mimeType: file.mimeType,
      });
      return;
    }

    const isMonitored = await isFileInMonitoredFolder(ctx, file);
    if (!isMonitored) {
      logger.debug('⏭️ 監視対象外フォルダのファイル', {
        fileName: file.name,
        parents: file.parents,
      });
      return;
    }

    await syncFileToRag(ctx, file);

    logger.info('✅ ファイル更新処理完了', {
      fileName: file.name,
    });

    ctx.prometheusClient.recordRAGSyncEvent('file_updated', file.mimeType, 'success');
  } catch (error) {
    logger.error('❌ ファイル更新処理エラー', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    ctx.prometheusClient.recordRAGSyncEvent('file_updated', file.mimeType, 'error');
    throw error;
  }
}

async function handleFileRemoval(
  ctx: GoogleDriveWebhookContext,
  change: DriveChangeEvent
): Promise<void> {
  try {
    logger.info('🗑️ ファイル削除処理開始', {
      fileId: change.fileId,
    });

    await removeFileFromRag(ctx, change.fileId);

    logger.info('✅ ファイル削除処理完了', {
      fileId: change.fileId,
    });

    ctx.prometheusClient.recordRAGSyncEvent('file_removed', 'unknown', 'success');
  } catch (error) {
    logger.error('❌ ファイル削除処理エラー', {
      fileId: change.fileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    ctx.prometheusClient.recordRAGSyncEvent('file_removed', 'unknown', 'error');
    throw error;
  }
}
