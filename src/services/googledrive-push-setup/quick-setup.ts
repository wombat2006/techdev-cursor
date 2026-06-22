import { logger } from '../../utils/logger';
import { saveChannelInfo } from './channel-storage';
import {
  setupFilePushNotifications,
  setupFolderChangeNotifications,
} from './channel-operations';
import type { GoogleDrivePushContext } from './drive-context';
import type { PushChannelResponse } from './types';

export async function quickSetupPushNotifications(
  ctx: GoogleDrivePushContext,
  folderId?: string,
  ttlHours: number = 24 * 7,
  persistChannel: typeof saveChannelInfo = saveChannelInfo
): Promise<{
  success: boolean;
  channels: PushChannelResponse[];
  message: string;
  nextSteps?: string[];
}> {
  try {
    logger.info('🚀 Google Drive Push通知簡単セットアップ開始');

    const channels: PushChannelResponse[] = [];

    const changeChannel = await setupFolderChangeNotifications(ctx, ttlHours);
    channels.push(changeChannel);

    if (folderId) {
      const fileChannel = await setupFilePushNotifications(ctx, folderId, ttlHours);
      channels.push(fileChannel);
    }

    channels.forEach((channel) => persistChannel(channel));

    const message = `Push通知設定完了: ${channels.length}個のチャンネルを作成しました`;
    const nextSteps = [
      'Webhook URLがHTTPS対応か確認してください',
      '通知受信テストを実行してください',
      '24時間後にチャンネル期限を確認してください',
    ];

    logger.info('✅ Google Drive Push通知簡単セットアップ完了', {
      channelCount: channels.length,
      folderId: folderId || 'all_changes',
    });

    return {
      success: true,
      channels,
      message,
      nextSteps,
    };
  } catch (error) {
    logger.error('❌ Google Drive Push通知簡単セットアップエラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      channels: [],
      message:
        'Push通知設定に失敗しました: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}
