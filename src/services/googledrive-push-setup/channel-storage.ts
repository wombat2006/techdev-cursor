import { logger } from '../../utils/logger';
import type { PushChannelResponse, StoredPushChannel } from './types';

const CHANNELS_ENV_KEY = 'GOOGLEDRIVE_PUSH_CHANNELS';

export function getStoredChannels(
  readEnv: (key: string) => string | undefined = (key) => process.env[key]
): StoredPushChannel[] {
  try {
    const storedData = readEnv(CHANNELS_ENV_KEY) || '[]';
    return JSON.parse(storedData) as StoredPushChannel[];
  } catch {
    return [];
  }
}

export function saveChannelInfo(
  channel: PushChannelResponse,
  readEnv: (key: string) => string | undefined = (key) => process.env[key],
  writeEnv: (key: string, value: string) => void = (key, value) => {
    process.env[key] = value;
  }
): void {
  try {
    const currentChannels = getStoredChannels(readEnv);
    const newChannel: StoredPushChannel = {
      id: channel.id,
      resourceId: channel.resourceId,
      expiration: channel.expiration,
    };

    currentChannels.push(newChannel);
    writeEnv(CHANNELS_ENV_KEY, JSON.stringify(currentChannels));

    logger.debug('💾 チャンネル情報保存完了', { channelId: channel.id });
  } catch (error) {
    logger.error('❌ チャンネル情報保存エラー', {
      channelId: channel.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
