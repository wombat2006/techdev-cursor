import { logger } from '../../utils/logger';
import { downloadDocument } from './download-document';
import { listDocuments } from './list-documents';
import type { ProcessedDocument } from './types';
import { addDocumentToVectorStore, getOrCreateVectorStore } from './vector-store';

export interface SyncConnectorOps {
  drive: any;
  openai: any;
  listDocuments: typeof listDocuments;
  downloadDocument: typeof downloadDocument;
  getOrCreateVectorStore: typeof getOrCreateVectorStore;
  addDocumentToVectorStore: typeof addDocumentToVectorStore;
}

export async function syncFolderToRAG(
  ops: SyncConnectorOps,
  folderId: string,
  vectorStoreName: string,
  batchSize: number = 5
): Promise<{
  vectorStoreId: string;
  processedCount: number;
  failedCount: number;
  processedDocuments: ProcessedDocument[];
  failedDocuments: Array<{ id: string; name: string; error: string }>;
}> {
  try {
    logger.info('🔄 GoogleDriveフォルダRAG同期開始', {
      folderId,
      vectorStoreName,
      batchSize,
    });

    const vectorStoreId = await ops.getOrCreateVectorStore(ops.openai, vectorStoreName);
    const documents = await ops.listDocuments(ops.drive, folderId);

    const processedDocuments: ProcessedDocument[] = [];
    const failedDocuments: Array<{ id: string; name: string; error: string }> = [];
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      logger.info('📦 バッチ処理開始', {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        totalDocuments: documents.length,
      });

      await Promise.allSettled(
        batch.map(async (docMeta) => {
          try {
            const document = await ops.downloadDocument(ops.drive, docMeta.id);
            const vectorStoreFileId = await ops.addDocumentToVectorStore(
              ops.openai,
              vectorStoreId,
              document
            );

            document.vectorStoreFileId = vectorStoreFileId;
            processedDocuments.push(document);
            processedCount++;

            logger.info('✅ ドキュメント処理完了', {
              name: document.name,
              vectorStoreFileId,
            });
          } catch (error) {
            failedCount++;
            const failureMessage = error instanceof Error ? error.message : 'Unknown error';
            failedDocuments.push({
              id: docMeta.id,
              name: docMeta.name,
              error: failureMessage,
            });
            logger.error('❌ ドキュメント処理失敗', {
              id: docMeta.id,
              name: docMeta.name,
              error: failureMessage,
            });
          }
        })
      );

      if (i + batchSize < documents.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    logger.info('🎉 GoogleDriveフォルダRAG同期完了', {
      vectorStoreId,
      processedCount,
      failedCount,
      totalDocuments: documents.length,
      failedDocuments: failedDocuments.length,
    });

    return {
      vectorStoreId,
      processedCount,
      failedCount,
      processedDocuments,
      failedDocuments,
    };
  } catch (error) {
    logger.error('❌ GoogleDriveフォルダRAG同期エラー', {
      folderId,
      vectorStoreName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function syncDocumentsById(
  ops: SyncConnectorOps,
  documentIds: string[],
  vectorStoreName: string
): Promise<{
  vectorStoreId: string;
  processed: Array<{ id: string; name: string; vectorStoreFileId: string }>;
  failed: Array<{ id: string; error: string }>;
}> {
  const vectorStoreId = await ops.getOrCreateVectorStore(ops.openai, vectorStoreName);
  const processed: Array<{ id: string; name: string; vectorStoreFileId: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const documentId of documentIds) {
    try {
      const document = await ops.downloadDocument(ops.drive, documentId);
      const vectorStoreFileId = await ops.addDocumentToVectorStore(
        ops.openai,
        vectorStoreId,
        document
      );
      processed.push({ id: documentId, name: document.name, vectorStoreFileId });
      logger.info('✅ ドキュメント再同期完了', { documentId, vectorStoreFileId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ id: documentId, error: message });
      logger.error('❌ ドキュメント再同期失敗', { documentId, error: message });
    }
  }

  return { vectorStoreId, processed, failed };
}
