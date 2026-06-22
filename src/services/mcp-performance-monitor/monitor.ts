import { logger } from '../../utils/logger';
import { mcpIntegrationService } from '../mcp-integration-service';
import { evaluateAlerts, mergeNewAlerts } from './alerts';
import { buildPerformanceMetrics, trimMetricsHistory } from './metrics-collector';
import { buildPerformanceSummary } from './performance-summary';
import {
  generateNewRecommendations,
  mergeRecommendations,
  pruneOldRecommendations,
} from './recommendations';
import {
  DEFAULT_ALERT_THRESHOLDS,
  type MCPAlert,
  type MCPAlertThresholds,
  type MCPOptimizationRecommendation,
  type MCPPerformanceMetrics,
  type PerformanceSummary,
} from './types';

export class MCPPerformanceMonitor {
  private metrics: MCPPerformanceMetrics[] = [];
  private alerts: MCPAlert[] = [];
  private recommendations: MCPOptimizationRecommendation[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds: MCPAlertThresholds = { ...DEFAULT_ALERT_THRESHOLDS };

  constructor() {
    this.startMonitoring();
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    logger.info('🔍 MCP Performance Monitor started', { intervalMs });

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.generateRecommendations();
    }, intervalMs);

    this.collectMetrics();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('🛑 MCP Performance Monitor stopped');
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const integrationMetrics = mcpIntegrationService.getPerformanceMetrics();
      const metrics = await buildPerformanceMetrics(integrationMetrics);

      this.metrics.push(metrics);
      this.metrics = trimMetricsHistory(this.metrics);

      logger.debug('MCP metrics collected', {
        total_requests: metrics.total_requests,
        cache_hit_rate: metrics.cache_hit_rate,
        response_time: metrics.average_response_time,
      });
    } catch (error) {
      logger.error('Error collecting MCP metrics', error);
    }
  }

  private checkAlerts(): void {
    if (this.metrics.length === 0) return;

    const latest = this.metrics[this.metrics.length - 1];
    const newAlerts = evaluateAlerts(latest, this.alertThresholds);
    const beforeCount = this.alerts.length;
    this.alerts = mergeNewAlerts(this.alerts, newAlerts);

    for (const alert of this.alerts.slice(beforeCount)) {
      logger.warn('MCP Alert generated', {
        severity: alert.severity,
        title: alert.title,
        metric: alert.metric,
        current_value: alert.current_value,
      });
    }
  }

  private generateRecommendations(): void {
    if (this.metrics.length < 5) return;

    const latest = this.metrics[this.metrics.length - 1];
    const newRecommendations = generateNewRecommendations(latest);
    const beforeCount = this.recommendations.length;
    this.recommendations = mergeRecommendations(this.recommendations, newRecommendations);
    this.recommendations = pruneOldRecommendations(this.recommendations);

    for (const rec of this.recommendations.slice(beforeCount)) {
      logger.info('MCP Optimization recommendation generated', {
        category: rec.category,
        priority: rec.priority,
        title: rec.title,
      });
    }
  }

  getLatestMetrics(): MCPPerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getTimeSeriesMetrics(hours: number = 1): MCPPerformanceMetrics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter((m) => m.timestamp > cutoff);
  }

  getActiveAlerts(): MCPAlert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  getRecommendations(category?: string): MCPOptimizationRecommendation[] {
    if (category) {
      return this.recommendations.filter((r) => r.category === category);
    }
    return this.recommendations;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolution_time = Date.now();
      logger.info('MCP Alert resolved', { alertId, title: alert.title });
      return true;
    }
    return false;
  }

  getPerformanceSummary(): PerformanceSummary {
    return buildPerformanceSummary(
      this.getLatestMetrics(),
      this.getActiveAlerts(),
      this.recommendations.length
    );
  }

  resetMetrics(): void {
    this.metrics = [];
    this.alerts = [];
    this.recommendations = [];
    logger.info('MCP Performance Monitor metrics reset');
  }
}
