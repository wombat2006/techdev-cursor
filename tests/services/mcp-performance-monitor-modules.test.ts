import { evaluateAlerts } from '../../src/services/mcp-performance-monitor/alerts';
import { calculateCostEfficiency } from '../../src/services/mcp-performance-monitor/metric-calculations';
import { buildPerformanceSummary } from '../../src/services/mcp-performance-monitor/performance-summary';
import { generateNewRecommendations } from '../../src/services/mcp-performance-monitor/recommendations';
import {
  DEFAULT_ALERT_THRESHOLDS,
  type MCPPerformanceMetrics,
} from '../../src/services/mcp-performance-monitor/types';

describe('mcp-performance-monitor SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports MCPPerformanceMonitor and singleton from shim path', async () => {
      const mod = await import('../../src/services/mcp-performance-monitor');
      expect(mod.MCPPerformanceMonitor).toBeDefined();
      expect(mod.mcpPerformanceMonitor).toBeDefined();
      expect(mod.default).toBe(mod.mcpPerformanceMonitor);
      mod.mcpPerformanceMonitor.stopMonitoring();
    });
  });

  describe('metric-calculations', () => {
    it('calculateCostEfficiency rewards cache hits', () => {
      const efficient = calculateCostEfficiency({ errorRate: 0.01, cache_hit_rate: 0.8 });
      const inefficient = calculateCostEfficiency({ errorRate: 0.2, cache_hit_rate: 0.1 });
      expect(efficient).toBeGreaterThan(inefficient);
    });
  });

  describe('alerts', () => {
    it('evaluateAlerts flags high response time', () => {
      const metrics: MCPPerformanceMetrics = {
        timestamp: Date.now(),
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        average_response_time: 6000,
        cache_hit_rate: 0.8,
        cache_size: 10,
        cache_efficiency: 0.9,
        circuit_breaker_activations: 0,
        active_circuit_breakers: [],
        queue_size: 1,
        queue_processing_time: 100,
        memory_usage: 100,
        cpu_usage: 0.1,
        active_connections: 0,
        wall_bounce_consensus_rate: 0.9,
        average_confidence_score: 0.85,
        estimated_cost_per_hour: 1,
        cost_efficiency_score: 0.9,
      };

      const alerts = evaluateAlerts(metrics, DEFAULT_ALERT_THRESHOLDS);
      expect(alerts.some((a) => a.metric === 'average_response_time')).toBe(true);
    });
  });

  describe('recommendations', () => {
    it('generateNewRecommendations suggests cache tuning on low hit rate', () => {
      const metrics: MCPPerformanceMetrics = {
        timestamp: Date.now(),
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        average_response_time: 1000,
        cache_hit_rate: 0.5,
        cache_size: 10,
        cache_efficiency: 0.5,
        circuit_breaker_activations: 0,
        active_circuit_breakers: [],
        queue_size: 1,
        queue_processing_time: 100,
        memory_usage: 100,
        cpu_usage: 0.1,
        active_connections: 0,
        wall_bounce_consensus_rate: 0.9,
        average_confidence_score: 0.85,
        estimated_cost_per_hour: 1,
        cost_efficiency_score: 0.9,
      };

      const recs = generateNewRecommendations(metrics);
      expect(recs.some((r) => r.id === 'improve_cache_efficiency')).toBe(true);
    });
  });

  describe('performance-summary', () => {
    it('buildPerformanceSummary returns critical when critical alerts exist', () => {
      const summary = buildPerformanceSummary(
        null,
        [
          {
            id: 'a1',
            severity: 'critical',
            title: 'test',
            description: 'test',
            metric: 'error_rate',
            current_value: 0.1,
            threshold: 0.05,
            timestamp: Date.now(),
            resolved: false,
          },
        ],
        0
      );
      expect(summary.overall_health).toBe('critical');
    });
  });
});
