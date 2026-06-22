import { createReadStream } from 'fs';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../../utils/logger';
import { sanitizeFileName } from '../../utils/security';
import type { ProcessedDocument } from './types';

export async function getOrCreateVectorStore(
  openai: any,
  name: string
): Promise<string> {
  try {
    logger.info('🗂️ Vector Store確認開始', { name });

    // 既存のVector Store検索
    const vectorStores = await openai.vectorStores.list();
    const existingStore = vectorStores.data.find((store: any) => store.name === name);

    if (existingStore) {
      logger.info('✅ 既存Vector Store使用', { id: existingStore.id, name });
      return existingStore.id;
    }

    // 新規Vector Store作成
    const newStore = await openai.vectorStores.create({
      name,
      expires_after: {
        anchor: 'last_active_at',
        days: 90 // 90日間非アクティブで自動削除
      }
    });

    logger.info('✅ Vector Store作成完了', { id: newStore.id, name });
    return newStore.id;

  } catch (error) {
    logger.error('❌ Vector Store作成エラー', { name, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

export async function addDocumentToVectorStore(
  openai: any,
  vectorStoreId: string,
  document: ProcessedDocument
): Promise<string> {
  const sanitizedDocument: ProcessedDocument = {
    ...document,
    name: sanitizeFileName(document.name),
    metadata: {
      ...document.metadata,
      name: sanitizeFileName(document.metadata.name)
    }
  };

  try {
    
    logger.info('📚 Vector Storeにドキュメント追加開始', {
      vectorStoreId,
      documentName: sanitizedDocument.name
    });

    // 一時ファイル作成
    const tempDir = '/tmp/googledrive-rag';
    await fs.mkdir(tempDir, { recursive: true });
    
    // ファイル拡張子を適切に設定
    const fileExtension = sanitizedDocument.metadata.mimeType === 'application/pdf' ? '.pdf' : '.txt';
    const tempFilePath = path.join(tempDir, `${sanitizedDocument.id}${fileExtension}`);
    
    // Bufferかプレーンテキストかを判定して適切に書き込み
    if (Buffer.isBuffer(sanitizedDocument.content)) {
      // バイナリファイルの場合、Bufferとして直接書き込み
      await fs.writeFile(tempFilePath, sanitizedDocument.content);
    } else {
      // テキストファイルの場合、UTF-8で書き込み
      await fs.writeFile(tempFilePath, sanitizedDocument.content, 'utf-8');
    }

    try {
      // OpenAI Files APIにアップロード
      const fileStream = createReadStream(tempFilePath);
      const file = await openai.files.create({
        file: fileStream,
        purpose: 'assistants'
      });

      // Vector Storeにファイル追加
      await openai.vectorStores.files.create(vectorStoreId, {
        file_id: file.id
      });

      // 一時ファイル削除
      await fs.unlink(tempFilePath);

      logger.info('✅ Vector Storeにドキュメント追加完了', {
        fileId: file.id,
        documentName: sanitizedDocument.name
      });

      return file.id;

    } catch (uploadError) {
      // エラー時も一時ファイル削除
      await fs.unlink(tempFilePath).catch(() => {});
      throw uploadError;
    }

  } catch (error) {
    logger.error('❌ Vector Storeドキュメント追加エラー', {
      vectorStoreId,
      documentName: sanitizedDocument.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function removeDocumentFromVectorStore(
  openai: any,
  vectorStoreId: string,
  vectorStoreFileId: string
): Promise<void> {
  try {
    logger.info('🗑️ Vector Storeファイル削除開始', {
      vectorStoreId,
      vectorStoreFileId
    });

    const filesApi: any = openai.vectorStores?.files;
    if (filesApi?.del) {
      await filesApi.del(vectorStoreId, vectorStoreFileId);
    } else if (filesApi?.delete) {
      await filesApi.delete(vectorStoreId, vectorStoreFileId);
    } else {
      throw new Error('Vector store file delete API is not available in current OpenAI SDK');
    }

    const rootFilesApi: any = openai.files;
    if (rootFilesApi?.del) {
      await rootFilesApi.del(vectorStoreFileId);
    } else if (rootFilesApi?.delete) {
      await rootFilesApi.delete(vectorStoreFileId);
    }

    logger.info('✅ Vector Storeファイル削除完了', {
      vectorStoreId,
      vectorStoreFileId
    });

  } catch (error) {
    logger.error('❌ Vector Storeファイル削除エラー', {
      vectorStoreId,
      vectorStoreFileId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
