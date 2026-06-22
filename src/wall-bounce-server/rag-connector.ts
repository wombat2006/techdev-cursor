import type { OpenAIConfig } from '../services/googledrive-connector';
import { GoogleDriveRAGConnector, type GoogleDriveConfig } from '../services/googledrive-connector';
import { logger } from '../utils/logger';

const driveConfig: GoogleDriveConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
};

const openAiDriveConfig: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  organization: process.env.OPENAI_ORGANIZATION,
};

let sharedRagConnector: GoogleDriveRAGConnector | null = null;

export function getSharedRagConnector(): GoogleDriveRAGConnector | null {
  if (sharedRagConnector) {
    return sharedRagConnector;
  }

  if (!driveConfig.clientId || !driveConfig.refreshToken || !openAiDriveConfig.apiKey) {
    logger.warn('⚠️ Google Drive/OpenAI credentials are missing; RAG source metadata is unavailable');
    return null;
  }

  try {
    sharedRagConnector = new GoogleDriveRAGConnector(driveConfig, openAiDriveConfig);
    logger.info('📂 Shared Google Drive RAG connector initialised');
  } catch (error) {
    logger.error('❌ Failed to initialise shared RAG connector', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    sharedRagConnector = null;
  }

  return sharedRagConnector;
}
