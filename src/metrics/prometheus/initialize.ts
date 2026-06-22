import { logger } from '../../utils/logger';
import {
  activeConnections,
  cacheHitRatio,
  circuitBreakerState,
  redisConnectionPoolSize,
} from './infrastructure-metrics';
import { register } from './registry';
import { restoreMetrics } from './persistence';

export function initializeMetrics(): void {
  logger.info('🔥 Prometheus metrics initialized', {
    registry: 'techsapo',
    metrics_count: register.getMetricsAsArray().length,
    default_metrics: true
  });

  // 初期値設定
  circuitBreakerState.set({ service: 'wall_bounce_analyzer' }, 0);
  circuitBreakerState.set({ service: 'llm_providers' }, 0);
  circuitBreakerState.set({ service: 'redis_cache' }, 0);

  cacheHitRatio.set({ cache_type: 'redis' }, 0.95);
  cacheHitRatio.set({ cache_type: 'memory' }, 0.85);

  redisConnectionPoolSize.set(10);
  activeConnections.set({ connection_type: 'http' }, 0);
  activeConnections.set({ connection_type: 'websocket' }, 0);
  activeConnections.set({ connection_type: 'database' }, 0);

  // Redisから永続化されたメトリクスを復元
  restoreMetrics().catch(error => {
    logger.warn('Failed to restore metrics on initialization', { error });
  });
}
