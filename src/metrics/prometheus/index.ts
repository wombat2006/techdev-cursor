export { register } from './registry';
export * from './wall-bounce-metrics';
export * from './llm-metrics';
export * from './http-metrics';
export * from './infrastructure-metrics';
export * from './rag-metrics';
export * from './security-metrics';
export { initializeMetrics } from './initialize';
export { persistMetrics, restoreMetrics } from './persistence';

import { logger } from '../../utils/logger';
import { register } from './registry';

logger.info('📊 TechSapo Prometheus metrics client loaded', {
  metrics_defined: register.getMetricsAsArray().length,
  registry: 'ready',
  persistence: 'redis',
});
