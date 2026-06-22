export { MCPPerformanceMonitor } from './monitor';
export { buildPerformanceMetrics, trimMetricsHistory } from './metrics-collector';
export { evaluateAlerts, createAlert, mergeNewAlerts } from './alerts';
export {
  generateNewRecommendations,
  mergeRecommendations,
  pruneOldRecommendations,
} from './recommendations';
export { buildPerformanceSummary } from './performance-summary';
export {
  calculateCacheEfficiency,
  calculateCostEfficiency,
  calculateQueueProcessingTime,
  estimateHourlyCost,
} from './metric-calculations';
export { getSystemMetrics } from './system-metrics';
export {
  DEFAULT_ALERT_THRESHOLDS,
  type IntegrationMetricsSnapshot,
  type MCPAlert,
  type MCPAlertThresholds,
  type MCPOptimizationRecommendation,
  type MCPPerformanceMetrics,
  type PerformanceSummary,
} from './types';

import { MCPPerformanceMonitor } from './monitor';

export const mcpPerformanceMonitor = new MCPPerformanceMonitor();
export default mcpPerformanceMonitor;
