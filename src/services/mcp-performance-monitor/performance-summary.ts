import type { MCPAlert, MCPPerformanceMetrics, PerformanceSummary } from './types';

export function buildPerformanceSummary(
  latest: MCPPerformanceMetrics | null,
  activeAlerts: MCPAlert[],
  recommendationsCount: number
): PerformanceSummary {
  let health: PerformanceSummary['overall_health'] = 'excellent';

  if (activeAlerts.some((a) => a.severity === 'critical')) {
    health = 'critical';
  } else if (activeAlerts.some((a) => a.severity === 'high')) {
    health = 'warning';
  } else if (activeAlerts.length > 0) {
    health = 'good';
  }

  return {
    overall_health: health,
    active_alerts_count: activeAlerts.length,
    recommendations_count: recommendationsCount,
    cache_hit_rate: latest?.cache_hit_rate || 0,
    average_response_time: latest?.average_response_time || 0,
    error_rate: latest ? latest.failed_requests / Math.max(latest.total_requests, 1) : 0,
    cost_efficiency: latest?.cost_efficiency_score || 0,
  };
}
