import { logger } from '../../utils/logger';
import { register } from './registry';
import { httpRequestsTotal } from './http-metrics';
import { llmRequestsTotal, llmTokenUsage } from './llm-metrics';
import { redisOperationsTotal } from './infrastructure-metrics';
import { wallbounceCostUsd, wallbounceRequestsTotal } from './wall-bounce-metrics';

let redisClient: any = null;

// Redis接続を遅延初期化
async function getRedisClient() {
  if (!redisClient) {
    try {
      const { getRedisService } = await import('../../services/redis-service');
      redisClient = getRedisService();
    } catch (error) {
      logger.warn('Redis not available for metrics persistence', { error });
    }
  }
  return redisClient;
}

// メトリクスをRedisに保存
export async function persistMetrics(): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const metrics = await register.getMetricsAsJSON();
    const metricsData: any = {};

    for (const metric of metrics) {
      if (metric.name.startsWith('techsapo_') && (metric as any).type === 'counter') {
        metricsData[metric.name] = (metric as any).values;
      }
    }

    await client.set('prometheus:metrics:snapshot', JSON.stringify(metricsData), {
      EX: 86400 * 30 // 30日間保持
    });

    logger.debug('Metrics persisted to Redis', { metrics_count: Object.keys(metricsData).length });
  } catch (error) {
    logger.error('Failed to persist metrics', { error });
  }
}

// Redisからメトリクスを復元
export async function restoreMetrics(): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const data = await client.get('prometheus:metrics:snapshot');
    if (!data) {
      logger.info('No persisted metrics found');
      return;
    }

    const metricsData = JSON.parse(data);
    let restored = 0;

    for (const [metricName, values] of Object.entries(metricsData)) {
      const metric = getMetricByName(metricName);
      if (metric && Array.isArray(values)) {
        for (const item of values as any[]) {
          if (item.labels && typeof item.value === 'number' && item.value > 0) {
            metric.inc(item.labels, item.value);
            restored++;
          }
        }
      }
    }

    logger.info('Metrics restored from Redis', { restored_values: restored });
  } catch (error) {
    logger.error('Failed to restore metrics', { error });
  }
}

// メトリクス名から実際のメトリックオブジェクトを取得
function getMetricByName(name: string): any {
  const metricsMap: { [key: string]: any } = {
    'techsapo_llm_requests_total': llmRequestsTotal,
    'techsapo_wallbounce_cost_usd': wallbounceCostUsd,
    'techsapo_llm_token_usage_total': llmTokenUsage,
    'techsapo_wallbounce_requests_total': wallbounceRequestsTotal,
    'techsapo_http_requests_total': httpRequestsTotal,
    'techsapo_redis_operations_total': redisOperationsTotal
  };
  return metricsMap[name];
}

// 定期的にメトリクスを保存（5分ごと）
setInterval(async () => {
  await persistMetrics();
}, 5 * 60 * 1000);

// プロセス終了時にメトリクスを保存
process.on('SIGTERM', async () => {
  await persistMetrics();
});

process.on('SIGINT', async () => {
  await persistMetrics();
});
