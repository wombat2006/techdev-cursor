import promClient from 'prom-client';
import { register } from './registry';

// Redis操作
export const redisOperationsTotal = new promClient.Counter({
  name: 'techsapo_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register]
});

// Redis接続プールサイズ
export const redisConnectionPoolSize = new promClient.Gauge({
  name: 'techsapo_redis_connection_pool_size',
  help: 'Current Redis connection pool size',
  registers: [register]
});

// MySQLクエリ
export const mysqlQueriesTotal = new promClient.Counter({
  name: 'techsapo_mysql_queries_total',
  help: 'Total number of MySQL queries',
  labelNames: ['query_type', 'status'],
  registers: [register]
});

// キャッシュヒット率
export const cacheHitRatio = new promClient.Gauge({
  name: 'techsapo_cache_hit_ratio',
  help: 'Cache hit ratio',
  labelNames: ['cache_type'],
  registers: [register]
});

/**
 * エラートラッキング
 */

// エラー総数
export const errorsTotal = new promClient.Counter({
  name: 'techsapo_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'severity', 'service'],
  registers: [register]
});

// サーキットブレーカー状態
export const circuitBreakerState = new promClient.Gauge({
  name: 'techsapo_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half_open, 2=open)',
  labelNames: ['service'],
  registers: [register]
});

/**
 * カスタムリソース使用量
 */

// コンポーネント別メモリ使用量
export const memoryUsage = new promClient.Gauge({
  name: 'techsapo_memory_usage_bytes',
  help: 'Memory usage by component',
  labelNames: ['component'],
  registers: [register]
});

// アクティブ接続数
export const activeConnections = new promClient.Gauge({
  name: 'techsapo_active_connections',
  help: 'Number of active connections',
  labelNames: ['connection_type'],
  registers: [register]
});

// キューサイズ
export const queueSize = new promClient.Gauge({
  name: 'techsapo_queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
  registers: [register]
});

// エラーを記録
export function recordError(
  errorType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  service: string
): void {
  errorsTotal.inc({ error_type: errorType, severity, service });
}
