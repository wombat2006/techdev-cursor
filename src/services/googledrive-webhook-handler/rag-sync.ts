import {
  clearDriveVectorMapping,
  rememberDriveVectorMapping,
  resolveDriveVectorMapping,
} from '../googledrive-vector-mapping';
import { logger } from '../../utils/logger';
import type { GoogleDriveWebhookContext } from './context';
import type { DriveFileRef } from './types';

export async function syncFileToRag(
  ctx: GoogleDriveWebhookContext,
  file: DriveFileRef
): Promise<void> {
  try {
    logger.info('📚 RAG同期開始', {
      fileId: file.id,
      fileName: file.name,
    });

    const document = await ctx.ragConnector.downloadDocument(file.id);
    const vectorStoreName = process.env.DEFAULT_VECTOR_STORE_NAME || 'techsapo-realtime-docs';
    const vectorStoreId = await ctx.ragConnector.getOrCreateVectorStore(vectorStoreName);
    const vectorStoreFileId = await ctx.ragConnector.addDocumentToVectorStore(
      vectorStoreId,
      document
    );

    await rememberDriveVectorMapping(file.id, vectorStoreId, vectorStoreFileId);

    logger.info('✅ RAG同期完了', {
      fileName: file.name,
      vectorStoreFileId,
    });
  } catch (error) {
    logger.error('❌ RAG同期エラー', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function removeFileFromRag(
  ctx: GoogleDriveWebhookContext,
  fileId: string
): Promise<void> {
  try {
    const mapping = await resolveDriveVectorMapping(fileId);

    if (!mapping) {
      logger.warn('⚠️ RAG mapping not found for Drive file', { fileId });
      return;
    }

    await ctx.ragConnector.removeDocumentFromVectorStore(
      mapping.vectorStoreId,
      mapping.vectorStoreFileId
    );

    await clearDriveVectorMapping(fileId);
  } catch (error) {
    logger.error('❌ RAGファイル削除エラー', {
      fileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
