import { logger } from '../../utils/logger';
import { getStoredChannels } from './channel-storage';
import { stopPushChannel } from './channel-operations';
import type { GoogleDrivePushContext } from './drive-context';
import type { ActiveChannelSummary } from './types';

export async function listActiveChannels(
  readEnv?: (key: string) => string | undefined
): Promise<{
  channels: ActiveChannelSummary[];
  totalCount: number;
  expiredCount: number;
}> {
  try {
    const storedChannels = getStoredChannels(readEnv);

    const channels = storedChannels.map((channel) => ({
      id: channel.id,
      resourceId: channel.resourceId,
      expiration: new Date(channel.expiration),
      isExpired: channel.expiration < Date.now(),
    }));

    const expiredCount = channels.filter((c) => c.isExpired).length;

    logger.info('📋 アクティブなPush通知チャンネル一覧', {
      totalCount: channels.length,
      expiredCount,
    });

    return {
      channels,
      totalCount: channels.length,
      expiredCount,
    };
  } catch (error) {
    logger.error('❌ Push通知チャンネル一覧取得エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function cleanupExpiredChannels(
  ctx: GoogleDrivePushContext,
  readEnv?: (key: string) => string | undefined
): Promise<{
  cleaned: number;
  errors: number;
  details: Array<{
    channelId: string;
    status: 'cleaned' | 'error';
    error?: string;
  }>;
}> {
  try {
    logger.info('🧹 期限切れチャンネル自動クリーンアップ開始');

    const { channels } = await listActiveChannels(readEnv);
    const expiredChannels = channels.filter((c) => c.isExpired);

    const results = {
      cleaned: 0,
      errors: 0,
      details: [] as Array<{
        channelId: string;
        status: 'cleaned' | 'error';
        error?: string;
      }>,
    };

    for (const channel of expiredChannels) {
      try {
        await stopPushChannel(ctx, channel.id, channel.resourceId);

        results.cleaned++;
        results.details.push({
          channelId: channel.id,
          status: 'cleaned',
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          channelId: channel.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('✅ 期限切れチャンネル自動クリーンアップ完了', results);
    return results;
  } catch (error) {
    logger.error('❌ 期限切れチャンネル自動クリーンアップエラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
