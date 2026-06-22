import { createWriteStream } from 'fs';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../../utils/logger';
import { sanitizeFileName } from '../../utils/security';
import type { DocumentMetadata, ProcessedDocument } from './types';

export async function downloadDocument(
  drive: any,
  documentId: string
): Promise<ProcessedDocument> {
  try {
    logger.info('⬇️ GoogleDriveドキュメントダウンロード開始', { documentId });

    // ファイル情報取得
    const fileResponse = await drive.files.get({
      fileId: documentId,
      fields: 'id,name,mimeType,size,modifiedTime,webViewLink'
    });

    const metadata: DocumentMetadata = {
      id: fileResponse.data.id,
      name: sanitizeFileName(fileResponse.data.name || ''),
      mimeType: fileResponse.data.mimeType,
      size: parseInt(fileResponse.data.size || '0'),
      modifiedTime: fileResponse.data.modifiedTime,
      webViewLink: fileResponse.data.webViewLink
    };

    // 🎯 壁打ち分析結果：サイズベース最適化戦略
    // 8MB以下: ArrayBuffer直接処理（高速）
    // 8MB以上: Streaming処理（メモリ効率）
    const SIZE_THRESHOLD = 8 * 1024 * 1024; // 8MB
    const MAX_PDF_SIZE = 50 * 1024 * 1024;   // 50MB
    
    if (metadata.mimeType === 'application/pdf' && metadata.size > MAX_PDF_SIZE) {
      throw new Error(`PDF file size (${Math.round(metadata.size / 1024 / 1024)}MB) exceeds maximum limit (50MB)`);
    }

    let content: string | Buffer = '';

    // MIMEタイプに応じたコンテンツ取得
    if (metadata.mimeType === 'application/vnd.google-apps.document') {
      // Google Docsをプレーンテキストでエクスポート
      const exportResponse = await drive.files.export({
        fileId: documentId,
        mimeType: 'text/plain'
      });
      content = exportResponse.data;
    } else if (metadata.mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Google Sheetsをテキストでエクスポート
      const exportResponse = await drive.files.export({
        fileId: documentId,
        mimeType: 'text/csv'
      });
      content = exportResponse.data;
    } else if (metadata.mimeType === 'application/vnd.google-apps.presentation') {
      // Google Slidesをテキストでエクスポート
      const exportResponse = await drive.files.export({
        fileId: documentId,
        mimeType: 'text/plain'
      });
      content = exportResponse.data;
    } else {
      // 🏓 統合戦略：サイズベース処理分岐
      const useStreamingMode = metadata.size > SIZE_THRESHOLD;
      
      logger.info('🎯 PDF処理モード選択', { 
        documentId, 
        mimeType: metadata.mimeType,
        fileSize: `${Math.round(metadata.size / 1024)}KB`,
        processingMode: useStreamingMode ? 'streaming' : 'arraybuffer'
      });
      
      if (!useStreamingMode) {
        // 小サイズファイル: ArrayBuffer直接処理（Codex方式）
        logger.info('⚡ ArrayBuffer直接処理開始');
        const downloadResponse = await drive.files.get(
          {
            fileId: documentId,
            alt: 'media'
          },
          { responseType: 'arraybuffer' }
        );
        const buffer = Buffer.from(downloadResponse.data as ArrayBuffer);
        if (metadata.mimeType === 'application/pdf') {
          content = buffer.toString('base64');
        } else {
          content = buffer.toString('utf-8');
        }
        
        logger.info('✅ ArrayBuffer処理完了', {
          bufferSize: buffer.length,
          contentType: typeof content
        });
        
      } else {
        // 大サイズファイル: Streaming処理（壁打ち推奨方式）
        logger.info('🌊 Streaming処理開始');
        
        const tmpDir = '/tmp/googledrive-rag';
        await fs.mkdir(tmpDir, { recursive: true });
        
        const fileExtension = metadata.mimeType === 'application/pdf' ? '.pdf' : 
                              metadata.mimeType.includes('image') ? '.img' : '.bin';
        const tmpPath = path.join(tmpDir, `${documentId}${fileExtension}`);
        
        try {
          // Node.js pipeline streaming処理
          const streamResponse = await drive.files.get({
            fileId: documentId,
            alt: 'media'
          }, {
            responseType: 'stream'
          });
          
          // Pipeline with back-pressure handling
          await new Promise<void>((resolve, reject) => {
            const writeStream = createWriteStream(tmpPath);
            
            streamResponse.data
              .on('error', reject)
              .pipe(writeStream)
              .on('error', reject)
              .on('finish', () => {
                logger.info('🌊 ストリーミング完了', { documentId });
                resolve();
              });
          });
          
          // ファイルからBufferに読み込み
          content = await fs.readFile(tmpPath);
          
          logger.info('✅ Streaming処理完了', {
            bufferSize: content.length,
            tmpPath
          });
          
        } finally {
          // 一時ファイル削除（確実なクリーンアップ）
          try {
            await fs.unlink(tmpPath);
            logger.info('🗑️ 一時ファイル削除完了', { tmpPath });
          } catch (cleanupError) {
            logger.warn('⚠️ 一時ファイル削除失敗', { 
              tmpPath, 
              error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
            });
          }
        }
      }
    }

    logger.info('✅ ドキュメントダウンロード完了', { 
      name: metadata.name, 
      contentLength: Buffer.isBuffer(content) ? content.length : content.length 
    });

    return {
      id: documentId,
      name: metadata.name,
      content,
      metadata
    };

  } catch (error) {
    logger.error('❌ ドキュメントダウンロードエラー', { 
      documentId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}
