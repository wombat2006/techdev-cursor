import type { MCPAlert, MCPAlertThresholds, MCPPerformanceMetrics } from './types';

export function createAlert(
  id: string,
  severity: MCPAlert['severity'],
  title: string,
  description: string,
  metric: string,
  currentValue: number,
  threshold: number
): MCPAlert {
  return {
    id: `${id}_${Date.now()}`,
    severity,
    title,
    description,
    metric,
    current_value: currentValue,
    threshold,
    timestamp: Date.now(),
    resolved: false,
  };
}

export function evaluateAlerts(
  latest: MCPPerformanceMetrics,
  thresholds: MCPAlertThresholds
): MCPAlert[] {
  const newAlerts: MCPAlert[] = [];

  if (latest.average_response_time > thresholds.response_time_ms) {
    newAlerts.push(
      createAlert(
        'high_response_time',
        'high',
        'High Response Time Detected',
        `Average response time (${latest.average_response_time}ms) exceeds threshold`,
        'average_response_time',
        latest.average_response_time,
        thresholds.response_time_ms
      )
    );
  }

  const errorRate = latest.failed_requests / Math.max(latest.total_requests, 1);
  if (errorRate > thresholds.error_rate) {
    newAlerts.push(
      createAlert(
        'high_error_rate',
        'critical',
        'High Error Rate Detected',
        `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold`,
        'error_rate',
        errorRate,
        thresholds.error_rate
      )
    );
  }

  if (latest.cache_hit_rate < thresholds.cache_hit_rate) {
    newAlerts.push(
      createAlert(
        'low_cache_hit_rate',
        'medium',
        'Low Cache Hit Rate',
        `Cache hit rate (${(latest.cache_hit_rate * 100).toFixed(1)}%) below optimal`,
        'cache_hit_rate',
        latest.cache_hit_rate,
        thresholds.cache_hit_rate
      )
    );
  }

  if (latest.queue_size > thresholds.queue_size) {
    newAlerts.push(
      createAlert(
        'large_queue_size',
        'high',
        'Large Queue Size',
        `Request queue size (${latest.queue_size}) is large`,
        'queue_size',
        latest.queue_size,
        thresholds.queue_size
      )
    );
  }

  if (latest.memory_usage > thresholds.memory_usage_mb) {
    newAlerts.push(
      createAlert(
        'high_memory_usage',
        'medium',
        'High Memory Usage',
        `Memory usage (${latest.memory_usage}MB) is high`,
        'memory_usage',
        latest.memory_usage,
        thresholds.memory_usage_mb
      )
    );
  }

  if (latest.active_circuit_breakers.length >= thresholds.circuit_breaker_threshold) {
    newAlerts.push(
      createAlert(
        'multiple_circuit_breakers',
        'critical',
        'Multiple Circuit Breakers Active',
        `${latest.active_circuit_breakers.length} circuit breakers are active`,
        'circuit_breakers',
        latest.active_circuit_breakers.length,
        thresholds.circuit_breaker_threshold
      )
    );
  }

  return newAlerts;
}

export function mergeNewAlerts(existing: MCPAlert[], incoming: MCPAlert[]): MCPAlert[] {
  const merged = [...existing];
  for (const alert of incoming) {
    const duplicate = merged.find((a) => a.metric === alert.metric && !a.resolved);
    if (!duplicate) {
      merged.push(alert);
    }
  }
  return merged;
}
