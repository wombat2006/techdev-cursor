import type { PushChannelConfig } from './types';

export const GOOGLEDRIVE_WEBHOOK_PATH = '/api/v1/webhooks/googledrive/notifications';

export function buildWebhookNotificationUrl(baseUrl: string): string {
  return `${baseUrl}${GOOGLEDRIVE_WEBHOOK_PATH}`;
}

export function buildFileChannelConfig(
  folderId: string,
  baseUrl: string,
  token: string,
  ttlHours: number
): PushChannelConfig {
  return {
    id: `techsapo-files-${folderId}-${Date.now()}`,
    type: 'web_hook',
    address: buildWebhookNotificationUrl(baseUrl),
    token,
    expiration: Date.now() + ttlHours * 60 * 60 * 1000,
    params: {
      ttl: ttlHours * 3600,
    },
  };
}

export function buildChangesChannelConfig(
  baseUrl: string,
  token: string,
  ttlHours: number
): PushChannelConfig {
  return {
    id: `techsapo-changes-${Date.now()}`,
    type: 'web_hook',
    address: buildWebhookNotificationUrl(baseUrl),
    token,
    expiration: Date.now() + ttlHours * 60 * 60 * 1000,
  };
}

export function isWebhookUrlValidForEnvironment(
  webhookUrl: string,
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return webhookUrl.startsWith('https://') || nodeEnv === 'development';
}
