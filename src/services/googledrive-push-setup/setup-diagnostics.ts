import { logger } from '../../utils/logger';
import {
  buildWebhookNotificationUrl,
  isWebhookUrlValidForEnvironment,
} from './channel-config';
import type { GoogleDrivePushContext } from './drive-context';
import type { PushSetupTestResult } from './types';

export async function testPushNotificationSetup(
  ctx: GoogleDrivePushContext,
  nodeEnv: string | undefined = process.env.NODE_ENV
): Promise<{
  success: boolean;
  tests: PushSetupTestResult[];
}> {
  const tests: PushSetupTestResult[] = [];

  try {
    logger.info('🔧 Push通知設定テスト開始');

    try {
      const tokenInfo = await ctx.oauth2Client.getAccessToken();
      tests.push({
        name: 'OAuth Authentication',
        status: 'passed',
        details: { hasToken: !!tokenInfo.token },
      });
    } catch (error) {
      tests.push({
        name: 'OAuth Authentication',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const response = await ctx.drive.about.get({ fields: 'user' });
      tests.push({
        name: 'Drive API Connection',
        status: 'passed',
        details: { user: response.data.user?.emailAddress },
      });
    } catch (error) {
      tests.push({
        name: 'Drive API Connection',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const webhookUrl = buildWebhookNotificationUrl(ctx.baseUrl);
      const urlValid = isWebhookUrlValidForEnvironment(webhookUrl, nodeEnv);

      tests.push({
        name: 'Webhook URL Validation',
        status: urlValid ? 'passed' : 'failed',
        details: { url: webhookUrl, isHttps: webhookUrl.startsWith('https://') },
        error: !urlValid ? 'Webhook URL must use HTTPS in production' : undefined,
      });
    } catch (error) {
      tests.push({
        name: 'Webhook URL Validation',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const success = tests.every((test) => test.status === 'passed');

    logger.info('✅ Push通知設定テスト完了', {
      success,
      passedTests: tests.filter((t) => t.status === 'passed').length,
      failedTests: tests.filter((t) => t.status === 'failed').length,
    });

    return { success, tests };
  } catch (error) {
    logger.error('❌ Push通知設定テストエラー', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      tests: [
        {
          name: 'Push Notification Setup Test',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}
