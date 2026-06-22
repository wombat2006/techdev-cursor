import promClient from 'prom-client';
import { register } from './registry';
import { recordError } from './infrastructure-metrics';

// GoogleDrive API呼び出し統計
export const googledriveApiRequestsTotal = new promClient.Counter({
  name: 'techsapo_googledrive_api_requests_total',
  help: 'Total number of Google Drive API requests',
  labelNames: ['operation', 'status', 'folder_id'],
  registers: [register]
});

// RAG同期処理時間
export const ragSyncDuration = new promClient.Histogram({
  name: 'techsapo_rag_sync_duration_seconds',
  help: 'RAG synchronization processing time in seconds',
  buckets: [1, 5, 15, 30, 60, 120, 300, 600],
  labelNames: ['folder_id', 'document_count', 'batch_size'],
  registers: [register]
});

// RAG検索リクエスト
export const ragSearchRequests = new promClient.Counter({
  name: 'techsapo_rag_search_requests_total',
  help: 'Total number of RAG search requests',
  labelNames: ['vector_store_id', 'status'],
  registers: [register]
});

// RAG検索処理時間
export const ragSearchDuration = new promClient.Histogram({
  name: 'techsapo_rag_search_duration_seconds',
  help: 'RAG search processing time in seconds',
  buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
  labelNames: ['vector_store_id', 'query_type'],
  registers: [register]
});

// RAGドキュメント処理統計
export const ragDocumentProcessingTotal = new promClient.Counter({
  name: 'techsapo_rag_document_processing_total',
  help: 'Total number of RAG document processing events',
  labelNames: ['mime_type', 'status'],
  registers: [register]
});

// Webhook通知統計
export const webhookNotificationsTotal = new promClient.Counter({
  name: 'techsapo_webhook_notifications_total',
  help: 'Total number of webhook notifications received',
  labelNames: ['source', 'resource_state', 'status'],
  registers: [register]
});

// Webhook処理時間
export const webhookProcessingDuration = new promClient.Histogram({
  name: 'techsapo_webhook_processing_duration_seconds',
  help: 'Webhook processing time in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0],
  labelNames: ['webhook_type'],
  registers: [register]
});

// RAGコスト追跡
export const ragCostUsd = new promClient.Counter({
  name: 'techsapo_rag_cost_usd',
  help: 'RAG operations cost in USD',
  labelNames: ['operation', 'provider'],
  registers: [register]
});

// RAG同期イベント記録
export function recordRAGSyncEvent(
  eventType: string,
  mimeType: string,
  status: string,
  folderId?: string,
  duration?: number
): void {
  ragDocumentProcessingTotal.inc({ mime_type: mimeType, status });
  
  if (folderId) {
    googledriveApiRequestsTotal.inc({ 
      operation: eventType, 
      status, 
      folder_id: folderId 
    });
  }
  
  if (duration) {
    ragSyncDuration.observe({ 
      folder_id: folderId || 'unknown',
      document_count: '1',
      batch_size: '1' 
    }, duration / 1000);
  }
}

// RAG検索記録
export function recordRAGSearch(
  vectorStoreId: string,
  queryType: string,
  duration: number,
  resultCount: number,
  status: string
): void {
  ragSearchRequests.inc({ vector_store_id: vectorStoreId, status });
  ragSearchDuration.observe({ vector_store_id: vectorStoreId, query_type: queryType }, duration / 1000);
}

// Webhook通知記録
export function recordWebhookNotification(resourceState: string, status: string): void {
  webhookNotificationsTotal.inc({ 
    source: 'googledrive', 
    resource_state: resourceState, 
    status 
  });
}

// Webhook処理時間記録
export function recordWebhookProcessingDuration(duration: number): void {
  webhookProcessingDuration.observe({ webhook_type: 'googledrive' }, duration / 1000);
}

// Webhookエラー記録
export function recordWebhookError(errorType: string): void {
  recordError(errorType, 'medium', 'webhook_handler');
  webhookNotificationsTotal.inc({ 
    source: 'googledrive', 
    resource_state: 'error', 
    status: 'failed' 
  });
}

// Drive同期イベント記録
export function recordDriveSyncEvent(eventType: string, resourceId: string): void {
  googledriveApiRequestsTotal.inc({ 
    operation: eventType, 
    status: 'success', 
    folder_id: resourceId 
  });
}

// RAGコスト記録
export function recordRAGCost(operation: string, provider: string, cost: number): void {
  ragCostUsd.inc({ operation, provider }, cost);
}
