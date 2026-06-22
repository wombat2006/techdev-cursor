import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger';
import type { CodexMCPConfig } from './types';
import type { CodexToolHandlerContext } from './tool-handlers';
import { handleSessionInfoTool } from './tool-handlers';

export interface CodexPerformanceMetrics {
  total_requests: number;
  cache_hits: number;
  batch_executions: number;
  avg_response_time: number;
  error_rate: number;
}

export class CodexPerformanceStore {
  readonly responseCache = new Map<string, { result: CallToolResult; timestamp: number }>();
  readonly requestBatch: Array<{
    id: string;
    request: { name: string; args: unknown };
    resolve: (value: CallToolResult) => void;
    reject: (reason: unknown) => void;
  }> = [];
  batchTimer: NodeJS.Timeout | null = null;
  readonly metrics: CodexPerformanceMetrics = {
    total_requests: 0,
    cache_hits: 0,
    batch_executions: 0,
    avg_response_time: 0,
    error_rate: 0,
  };

  constructor(private readonly config: CodexMCPConfig) {}

  isReadOnlyOperation(name: string, args: Record<string, unknown>): boolean {
    return name === 'codex-session-info' || (name === 'codex' && args.sandbox === 'read-only');
  }

  generateCacheKey(name: string, args: unknown): string {
    return `${name}:${JSON.stringify(args)}`;
  }

  getCachedResponse(cacheKey: string): CallToolResult | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (this.config.cache_ttl_ms || 300000)) {
      return cached.result;
    }
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    return null;
  }

  cacheResponse(cacheKey: string, result: CallToolResult): void {
    if (this.responseCache.size > 1000) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }
    this.responseCache.set(cacheKey, { result, timestamp: Date.now() });
  }

  isBatchableOperation(name: string): boolean {
    return name === 'codex-session-info';
  }

  handleBatchedRequest(ctx: CodexToolHandlerContext, name: string, args: unknown): Promise<CallToolResult> {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random()}`;
      this.requestBatch.push({ id: requestId, request: { name, args }, resolve, reject });

      if (!this.batchTimer && this.config.enable_request_batching) {
        this.batchTimer = setTimeout(() => {
          void this.processBatch(ctx);
        }, this.config.batch_timeout_ms || 1000);
      }

      if (this.requestBatch.length >= (this.config.batch_size || 5)) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
          this.batchTimer = null;
        }
        void this.processBatch(ctx);
      }
    });
  }

  async processBatch(ctx: CodexToolHandlerContext): Promise<void> {
    if (this.requestBatch.length === 0) return;

    const batch = [...this.requestBatch];
    this.requestBatch.length = 0;
    this.batchTimer = null;
    this.metrics.batch_executions++;

    logger.debug(`Processing batch of ${batch.length} requests`);

    const results = await Promise.allSettled(
      batch.map(async (item) => {
        switch (item.request.name) {
          case 'codex-session-info':
            return await handleSessionInfoTool(ctx, item.request.args);
          default:
            throw new Error(`Batch operation not supported for: ${item.request.name}`);
        }
      })
    );

    batch.forEach((item, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        item.resolve(result.value);
      } else {
        item.reject(result.reason);
      }
    });
  }

  updatePerformanceMetrics(executionTime: number, success: boolean): void {
    const currentAvg = this.metrics.avg_response_time;
    const totalRequests = this.metrics.total_requests;

    this.metrics.avg_response_time =
      (currentAvg * (totalRequests - 1) + executionTime) / totalRequests;

    if (!success) {
      this.metrics.error_rate =
        (this.metrics.error_rate * (totalRequests - 1) + 1) / totalRequests;
    }
  }
}
