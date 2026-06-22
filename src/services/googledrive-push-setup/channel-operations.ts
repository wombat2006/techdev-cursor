import { logger } from '../../utils/logger';
import {
  buildChangesChannelConfig,
  buildFileChannelConfig,
} from './channel-config';
import type { GoogleDrivePushContext } from './drive-context';
import { generateSecureToken } from './token-utils';
import type { PushChannelResponse } from './types';

const WATCH_FIELDS = 'kind,id,resourceId,resourceUri,token,expiration';

export async function setupFilePushNotifications(
  ctx: GoogleDrivePushContext,
  folderId: string,
  ttlHours: number = 24 * 7
): Promise<PushChannelResponse> {
  try {
    logger.info('🔔 ファイル変更Push通知設定開始', {
      folderId,
      ttlHours,
    });

    const channelConfig = buildFileChannelConfig(
      folderId,
      ctx.baseUrl,
      generateSecureToken(),
      ttlHours
    );

    const response = await ctx.drive.files.watch({
      fileId: folderId,
      requestBody: channelConfig,
      fields: WATCH_FIELDS,
    });

    logger.info('✅ ファイル変更Push通知設定完了', {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: new Date(response.data.expiration).toISOString(),
    });

    return response.data as PushChannelResponse;
  } catch (error) {
    logger.error('❌ ファイル変更Push通知設定エラー', {
      folderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function setupFolderChangeNotifications(
  ctx: GoogleDrivePushContext,
  ttlHours: number = 24 * 7
): Promise<PushChannelResponse> {
  try {
    logger.info('📁 フォルダ変更Push通知設定開始', {
      ttlHours,
    });

    const startPageTokenResponse = await ctx.drive.changes.getStartPageToken();
    const startPageToken = startPageTokenResponse.data.startPageToken;

    const channelConfig = buildChangesChannelConfig(
      ctx.baseUrl,
      generateSecureToken(),
      ttlHours
    );

    const response = await ctx.drive.changes.watch({
      pageToken: startPageToken,
      requestBody: channelConfig,
      includeItemsFromAllDrives: false,
      supportsAllDrives: false,
      fields: WATCH_FIELDS,
    });

    logger.info('✅ フォルダ変更Push通知設定完了', {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      startPageToken,
      expiration: new Date(response.data.expiration).toISOString(),
    });

    return response.data as PushChannelResponse;
  } catch (error) {
    logger.error('❌ フォルダ変更Push通知設定エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function stopPushChannel(
  ctx: GoogleDrivePushContext,
  channelId: string,
  resourceId: string
): Promise<void> {
  try {
    logger.info('🛑 Push通知チャンネル停止開始', {
      channelId,
      resourceId,
    });

    await ctx.drive.channels.stop({
      requestBody: {
        id: channelId,
        resourceId,
      },
    });

    logger.info('✅ Push通知チャンネル停止完了', {
      channelId,
    });
  } catch (error) {
    logger.error('❌ Push通知チャンネル停止エラー', {
      channelId,
      resourceId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function renewPushChannel(
  ctx: GoogleDrivePushContext,
  channelId: string,
  resourceId: string,
  ttlHours: number = 24 * 7
): Promise<PushChannelResponse> {
  try {
    logger.info('🔄 Push通知チャンネル更新開始', {
      channelId,
      resourceId,
      ttlHours,
    });

    await stopPushChannel(ctx, channelId, resourceId);
    return await setupFolderChangeNotifications(ctx, ttlHours);
  } catch (error) {
    logger.error('❌ Push通知チャンネル更新エラー', {
      channelId,
      resourceId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
