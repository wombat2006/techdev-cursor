import type { Request } from 'express';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

export function verifyWebhookSignature(
  req: Request,
  webhookSecret: string,
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  try {
    const providedSignature = req.headers['x-goog-channel-signature'] as string;
    if (!providedSignature) {
      logger.debug('⚠️ Webhook署名ヘッダーなし（開発環境許可）');
      return nodeEnv === 'development';
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const signatureMatch = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!signatureMatch) {
      logger.warn('🚫 Webhook署名不一致', {
        provided: `${providedSignature.substring(0, 8)}...`,
        expected: `${expectedSignature.substring(0, 8)}...`,
      });
    }

    return signatureMatch;
  } catch (error) {
    logger.error('❌ Webhook署名検証エラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
