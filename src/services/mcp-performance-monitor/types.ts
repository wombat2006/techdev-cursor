export interface MCPPerformanceMetrics {
  timestamp: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  cache_hit_rate: number;
  cache_size: number;
  cache_efficiency: number;
  circuit_breaker_activations: number;
  active_circuit_breakers: string[];
  queue_size: number;
  queue_processing_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  wall_bounce_consensus_rate: number;
  average_confidence_score: number;
  estimated_cost_per_hour: number;
  cost_efficiency_score: number;
}

export interface MCPAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  current_value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  resolution_time?: number;
}

export interface MCPOptimizationRecommendation {
  id: string;
  category: 'performance' | 'cost' | 'reliability' | 'security';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  implementation_effort: 'low' | 'medium' | 'high';
  estimated_improvement: string;
  action_items: string[];
}

export interface MCPAlertThresholds {
  response_time_ms: number;
  error_rate: number;
  cache_hit_rate: number;
  queue_size: number;
  memory_usage_mb: number;
  circuit_breaker_threshold: number;
}

export const DEFAULT_ALERT_THRESHOLDS: MCPAlertThresholds = {
  response_time_ms: 5000,
  error_rate: 0.05,
  cache_hit_rate: 0.6,
  queue_size: 10,
  memory_usage_mb: 512,
  circuit_breaker_threshold: 3,
};

export interface IntegrationMetricsSnapshot {
  totalRequests?: number;
  errorRate?: number;
  averageExecutionTime?: number;
  cache_hit_rate?: number;
  cache_size?: number;
  circuitBreakerActivations?: number;
  active_circuits?: string[];
  queue_size?: number;
}

export interface PerformanceSummary {
  overall_health: 'excellent' | 'good' | 'warning' | 'critical';
  active_alerts_count: number;
  recommendations_count: number;
  cache_hit_rate: number;
  average_response_time: number;
  error_rate: number;
  cost_efficiency: number;
}
