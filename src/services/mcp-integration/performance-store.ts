import { logger } from '../../utils/logger';
import type { MCPExecutionRequest, MCPExecutionResult } from './types';

export type McpMetrics = {
  totalRequests: number;
  cacheHits: number;
  circuitBreakerActivations: number;
  averageExecutionTime: number;
  errorRate: number;
};

export class McpPerformanceStore {
  private responseCache = new Map<string, { result: MCPExecutionResult; timestamp: number }>();
  private circuitBreaker = new Map<
    string,
    { failures: number; lastFailure: number; isOpen: boolean }
  >();
  private requestQueue: Array<{
    request: MCPExecutionRequest;
    resolve: (value: MCPExecutionResult) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private isProcessingQueue = false;

  metrics: McpMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    circuitBreakerActivations: 0,
    averageExecutionTime: 0,
    errorRate: 0,
  };

  generateCacheKey(request: MCPExecutionRequest): string {
    return `mcp_${JSON.stringify({
      tools: request.tools.map((t) => t.name),
      context: request.context,
      timeout: request.timeout,
    })}`;
  }

  getCachedResult(cacheKey: string): MCPExecutionResult | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.result;
    }
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    return null;
  }

  cacheResult(cacheKey: string, result: MCPExecutionResult): void {
    if (this.responseCache.size > 500) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }
    this.responseCache.set(cacheKey, { result, timestamp: Date.now() });
  }

  getCircuitBreakerKey(request: MCPExecutionRequest): string {
    const environment = (request.context as any).environment || 'default';
    const taskType = (request.context as any).task_type || request.context.taskType || 'basic';
    return `${environment}_${taskType}`;
  }

  isCircuitOpen(circuitKey: string): boolean {
    const circuit = this.circuitBreaker.get(circuitKey);
    if (!circuit) return false;

    if (circuit.failures >= 5 && Date.now() - circuit.lastFailure < 30000) {
      return true;
    }

    if (Date.now() - circuit.lastFailure > 30000) {
      circuit.failures = 0;
      circuit.isOpen = false;
    }

    return circuit.isOpen;
  }

  recordCircuitBreakerFailure(circuitKey: string): void {
    const circuit = this.circuitBreaker.get(circuitKey) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    circuit.failures++;
    circuit.lastFailure = Date.now();
    circuit.isOpen = circuit.failures >= 5;
    this.circuitBreaker.set(circuitKey, circuit);

    if (circuit.isOpen) {
      this.metrics.circuitBreakerActivations++;
      logger.warn('Circuit breaker activated', { circuitKey, failures: circuit.failures });
    }
  }

  shouldQueue(): boolean {
    return this.requestQueue.length > 0 || this.isProcessingQueue;
  }

  async queueRequest(
    request: MCPExecutionRequest,
    execute: (req: MCPExecutionRequest) => Promise<MCPExecutionResult>
  ): Promise<MCPExecutionResult> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, resolve, reject });
      void this.processQueue(execute);
    });
  }

  private async processQueue(
    execute: (req: MCPExecutionRequest) => Promise<MCPExecutionResult>
  ): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    logger.debug(`Processing MCP request queue: ${this.requestQueue.length} items`);

    while (this.requestQueue.length > 0) {
      const item = this.requestQueue.shift();
      if (!item) break;

      const { request, resolve, reject } = item;

      try {
        const modifiedRequest = { ...request, priority: 'medium' as const };
        const result = await execute(modifiedRequest);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    this.isProcessingQueue = false;
  }

  getPerformanceMetrics(): any {
    const cacheHitRate =
      this.metrics.totalRequests > 0 ? this.metrics.cacheHits / this.metrics.totalRequests : 0;

    return {
      ...this.metrics,
      cache_hit_rate: cacheHitRate,
      cache_size: this.responseCache.size,
      circuit_breaker_count: this.circuitBreaker.size,
      queue_size: this.requestQueue.length,
      is_processing_queue: this.isProcessingQueue,
      active_circuits: Array.from(this.circuitBreaker.entries())
        .filter(([, circuit]) => circuit.isOpen)
        .map(([key]) => key),
    };
  }

  reset(): void {
    this.responseCache.clear();
    this.circuitBreaker.clear();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      circuitBreakerActivations: 0,
      averageExecutionTime: 0,
      errorRate: 0,
    };
    logger.info('MCP Integration Service optimizations reset');
  }
}
