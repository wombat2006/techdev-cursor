import type { Request } from 'express';
import { logger } from '../../utils/logger';
import {
  createGoogleDriveWebhookContext,
  parseWebhookNotification,
  type GoogleDriveWebhookContext,
} from './context';
import { processWebhookNotification } from './notification-handlers';
import { verifyWebhookSignature } from './signature-verification';
import type { GoogleDriveConfig, OpenAIConfig } from '../googledrive-connector/types';
import type { WebhookHandlerStats } from './types';

export class GoogleDriveWebhookHandler {
  private readonly ctx: GoogleDriveWebhookContext;

  constructor(
    googleDriveConfig: GoogleDriveConfig,
    openaiConfig: OpenAIConfig,
    webhookSecret: string
  ) {
    this.ctx = createGoogleDriveWebhookContext(googleDriveConfig, openaiConfig, webhookSecret);
  }

  async handleWebhook(req: Request): Promise<{ status: number; body: unknown }> {
    try {
      logger.info('📥 Google Drive Webhook受信', {
        headers: {
          'x-goog-channel-id': req.headers['x-goog-channel-id'],
          'x-goog-resource-id': req.headers['x-goog-resource-id'],
          'x-goog-resource-state': req.headers['x-goog-resource-state'],
          'x-goog-resource-uri': req.headers['x-goog-resource-uri'],
        },
        body: req.body,
      });

      if (!verifyWebhookSignature(req, this.ctx.webhookSecret)) {
        logger.warn('❌ Webhook署名検証失敗');
        return {
          status: 401,
          body: { error: 'Invalid webhook signature' },
        };
      }

      const { notification, resourceState } = parseWebhookNotification(req);
      await processWebhookNotification(this.ctx, notification, resourceState);

      this.ctx.prometheusClient.recordWebhookNotification(resourceState, 'success');

      return {
        status: 200,
        body: {
          status: 'success',
          message: 'Webhook processed successfully',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('❌ Webhook処理エラー', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      this.ctx.prometheusClient.recordWebhookNotification('error', 'failed');

      return {
        status: 500,
        body: {
          error: 'Webhook processing failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  addMonitoredFolder(folderId: string): void {
    this.ctx.monitoredFolders.add(folderId);
    logger.info('📁 監視フォルダ追加', { folderId });
  }

  removeMonitoredFolder(folderId: string): void {
    this.ctx.monitoredFolders.delete(folderId);
    logger.info('📁 監視フォルダ削除', { folderId });
  }

  getMonitoredFolders(): string[] {
    return Array.from(this.ctx.monitoredFolders);
  }

  getWebhookStats(): WebhookHandlerStats {
    return {
      monitoredFoldersCount: this.ctx.monitoredFolders.size,
      supportedMimeTypes: [...this.ctx.supportedMimeTypes],
      isInitialized: !!this.ctx.ragConnector && !!this.ctx.drive,
    };
  }
}

export default GoogleDriveWebhookHandler;
