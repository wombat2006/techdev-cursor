import type { Request } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrometheusClient } from '../../metrics/prometheus-client-class';
import { GoogleDriveRAGConnector } from '../googledrive-connector/index';
import type { GoogleDriveConfig, OpenAIConfig } from '../googledrive-connector/types';
import { logger } from '../../utils/logger';
import { SUPPORTED_RAG_MIME_TYPES } from './supported-mime-types';
import type { WebhookNotification } from './types';

export interface GoogleDriveWebhookContext {
  googleDriveConfig: GoogleDriveConfig;
  openaiConfig: OpenAIConfig;
  webhookSecret: string;
  ragConnector: GoogleDriveRAGConnector;
  oauth2Client: OAuth2Client;
  drive: any;
  prometheusClient: PrometheusClient;
  monitoredFolders: Set<string>;
  supportedMimeTypes: readonly string[];
}

export function createGoogleDriveWebhookContext(
  googleDriveConfig: GoogleDriveConfig,
  openaiConfig: OpenAIConfig,
  webhookSecret: string
): GoogleDriveWebhookContext {
  const ragConnector = new GoogleDriveRAGConnector(googleDriveConfig, openaiConfig);

  const oauth2Client = new OAuth2Client(
    googleDriveConfig.clientId,
    googleDriveConfig.clientSecret,
    googleDriveConfig.redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: googleDriveConfig.refreshToken,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  logger.info('🔔 Google Drive Webhookハンドラー初期化完了', {
    supportedMimeTypes: SUPPORTED_RAG_MIME_TYPES.length,
  });

  return {
    googleDriveConfig,
    openaiConfig,
    webhookSecret,
    ragConnector,
    oauth2Client,
    drive,
    prometheusClient: PrometheusClient.getInstance(),
    monitoredFolders: new Set<string>(),
    supportedMimeTypes: SUPPORTED_RAG_MIME_TYPES,
  };
}

export function parseWebhookNotification(req: Request): {
  notification: WebhookNotification;
  resourceState: string;
} {
  const notification = {
    kind: req.headers['x-goog-channel-id'] as string,
    id: req.headers['x-goog-channel-id'] as string,
    resourceId: req.headers['x-goog-resource-id'] as string,
    resourceUri: req.headers['x-goog-resource-uri'] as string,
    token: req.headers['x-goog-channel-token'] as string,
    expiration: parseInt((req.headers['x-goog-channel-expiration'] as string) || '0', 10),
  };

  return {
    notification,
    resourceState: req.headers['x-goog-resource-state'] as string,
  };
}
