import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleDriveConfig } from '../googledrive-connector/types';
import { logger } from '../../utils/logger';

export interface GoogleDrivePushContext {
  oauth2Client: OAuth2Client;
  drive: any;
  baseUrl: string;
  googleDriveConfig: GoogleDriveConfig;
}

export function resolveWebhookBaseUrl(baseUrl?: string): string {
  return baseUrl || process.env.WEBHOOK_BASE_URL || 'https://your-domain.com';
}

export function createGoogleDrivePushContext(
  googleDriveConfig: GoogleDriveConfig,
  baseUrl?: string
): GoogleDrivePushContext {
  const oauth2Client = new OAuth2Client(
    googleDriveConfig.clientId,
    googleDriveConfig.clientSecret,
    googleDriveConfig.redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: googleDriveConfig.refreshToken,
  });

  const resolvedBaseUrl = resolveWebhookBaseUrl(baseUrl);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  logger.info('🔔 Google Drive Push Setup初期化完了', {
    baseUrl: resolvedBaseUrl,
  });

  return {
    oauth2Client,
    drive,
    baseUrl: resolvedBaseUrl,
    googleDriveConfig,
  };
}
