import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { buildSafetyAlert, trimAlertHistory } from './alerts';
import { executeEmergencyRollback } from './emergency-rollback';
import { collectCurrentMetrics } from './metrics-collector';
import { trimMetricsHistory } from './metrics-history';
import { evaluateAllSafetyChecks } from './safety-evaluations';
import { loadSafetyThresholds } from './thresholds';
import type { SafetyAlert, SafetyMetrics, SafetyThresholds } from './types';

export class SRPSafetyMonitor extends EventEmitter {
  private static instance: SRPSafetyMonitor;
  private thresholds: SafetyThresholds;
  private metricsHistory: SafetyMetrics[] = [];
  private alertHistory: SafetyAlert[] = [];
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private isEmergencyMode = false;

  private constructor() {
    super();

    this.thresholds = loadSafetyThresholds();
    this.on('warning', this.handleWarning.bind(this));
    this.on('critical', this.handleCritical.bind(this));
    this.on('emergency', this.handleEmergency.bind(this));

    logger.info('🛡️ SRP Safety Monitor initialized', {
      phase: 'phase3_5percent',
      thresholds: this.thresholds,
    });
  }

  public static getInstance(): SRPSafetyMonitor {
    if (!SRPSafetyMonitor.instance) {
      SRPSafetyMonitor.instance = new SRPSafetyMonitor();
    }
    return SRPSafetyMonitor.instance;
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      logger.warn('⚠️ Safety monitor already running');
      return;
    }

    logger.info('🚀 Starting SRP Safety Monitor for Phase 3', {
      monitoringInterval: '30 seconds',
      autoRollbackEnabled: process.env.AUTO_ROLLBACK_ON_ERROR_SPIKE === 'true',
    });

    this.monitoringInterval = setInterval(() => {
      this.performSafetyCheck();
    }, 30000);

    this.performSafetyCheck();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      logger.info('🛑 SRP Safety Monitor stopped');
    }
  }

  private async performSafetyCheck(): Promise<void> {
    try {
      const metrics = await collectCurrentMetrics(this.metricsHistory);
      this.metricsHistory.push(metrics);
      this.metricsHistory = trimMetricsHistory(this.metricsHistory);

      for (const draft of evaluateAllSafetyChecks(metrics, this.thresholds)) {
        this.emitAlert(draft.level, draft.category, draft.message, draft.metrics);
      }

      logger.debug('🔍 Safety check completed', {
        timestamp: metrics.timestamp,
        errorRate: metrics.errorRate,
        avgLatency: metrics.avgLatency,
        memoryUsage: metrics.memoryUsagePercent,
      });
    } catch (error) {
      logger.error('❌ Safety check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      this.emitAlert('warning', 'system', 'Safety monitoring system failure', {});
    }
  }

  private emitAlert(
    level: SafetyAlert['level'],
    category: SafetyAlert['category'],
    message: string,
    metrics: Partial<SafetyMetrics>
  ): void {
    const alert = buildSafetyAlert({ level, category, message, metrics });
    this.alertHistory = trimAlertHistory([...this.alertHistory, alert]);
    this.emit(level, alert);
  }

  private handleWarning(alert: SafetyAlert): void {
    logger.warn(`⚠️ SRP Safety Warning: ${alert.message}`, {
      category: alert.category,
      metrics: alert.metrics,
      actionRequired: alert.actionRequired,
    });
  }

  private handleCritical(alert: SafetyAlert): void {
    logger.error(`🚨 SRP Safety Critical Alert: ${alert.message}`, {
      category: alert.category,
      metrics: alert.metrics,
      actionRequired: alert.actionRequired,
    });

    logger.error('📢 CRITICAL ALERT NOTIFICATION', {
      alert,
      phase: 'phase3_5percent',
      recommendation: 'Consider immediate intervention',
    });
  }

  private async handleEmergency(alert: SafetyAlert): Promise<void> {
    logger.error(`💥 SRP EMERGENCY: ${alert.message}`, {
      category: alert.category,
      metrics: alert.metrics,
      actionRequired: alert.actionRequired,
    });

    if (!this.isEmergencyMode) {
      this.isEmergencyMode = true;
      await executeEmergencyRollback(alert, (record) => {
        this.stopMonitoring();
        this.emit('rollback-executed', record);
      });
    }
  }

  public getStatusReport(): object {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const recentAlerts = this.alertHistory.slice(-10);

    return {
      monitoringActive: !!this.monitoringInterval,
      emergencyMode: this.isEmergencyMode,
      latestMetrics,
      recentAlerts,
      thresholds: this.thresholds,
      metricsHistoryCount: this.metricsHistory.length,
      alertHistoryCount: this.alertHistory.length,
    };
  }
}
