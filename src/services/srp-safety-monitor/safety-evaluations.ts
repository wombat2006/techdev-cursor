import type { SafetyAlertDraft, SafetyMetrics, SafetyThresholds } from './types';

export function evaluateErrorRates(
  metrics: SafetyMetrics,
  thresholds: SafetyThresholds
): SafetyAlertDraft[] {
  const alerts: SafetyAlertDraft[] = [];

  if (metrics.errorRate >= thresholds.criticalErrorRate) {
    alerts.push({
      level: 'emergency',
      category: 'error_rate',
      message: `Critical error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
      metrics,
    });
  } else if (metrics.errorRate >= thresholds.warningErrorRate) {
    alerts.push({
      level: 'warning',
      category: 'error_rate',
      message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
      metrics,
    });
  }

  if (metrics.srp5MinuteErrorRate >= thresholds.criticalErrorRate * 0.8) {
    alerts.push({
      level: 'critical',
      category: 'error_rate',
      message: `Sustained high SRP error rate over 5 minutes: ${(metrics.srp5MinuteErrorRate * 100).toFixed(2)}%`,
      metrics,
    });
  }

  return alerts;
}

export function evaluateLatency(
  metrics: SafetyMetrics,
  thresholds: SafetyThresholds
): SafetyAlertDraft[] {
  const alerts: SafetyAlertDraft[] = [];

  if (metrics.srpAvgLatency >= thresholds.criticalLatency) {
    alerts.push({
      level: 'critical',
      category: 'latency',
      message: `Critical SRP latency: ${metrics.srpAvgLatency}ms`,
      metrics,
    });
  } else if (metrics.srpAvgLatency >= thresholds.warningLatency) {
    alerts.push({
      level: 'warning',
      category: 'latency',
      message: `High SRP latency: ${metrics.srpAvgLatency}ms`,
      metrics,
    });
  }

  return alerts;
}

export function evaluateMemoryUsage(
  metrics: SafetyMetrics,
  thresholds: SafetyThresholds
): SafetyAlertDraft[] {
  const alerts: SafetyAlertDraft[] = [];

  if (metrics.memoryUsagePercent >= thresholds.criticalMemory) {
    alerts.push({
      level: 'emergency',
      category: 'memory',
      message: `Critical memory usage: ${metrics.memoryUsagePercent}%`,
      metrics,
    });
  } else if (metrics.memoryUsagePercent >= thresholds.warningMemory) {
    alerts.push({
      level: 'warning',
      category: 'memory',
      message: `High memory usage: ${metrics.memoryUsagePercent}%`,
      metrics,
    });
  }

  return alerts;
}

export function evaluateConsensusQuality(
  metrics: SafetyMetrics,
  thresholds: SafetyThresholds
): SafetyAlertDraft[] {
  const alerts: SafetyAlertDraft[] = [];

  if (metrics.averageConfidence < thresholds.minConsensusConfidence) {
    alerts.push({
      level: 'warning',
      category: 'consensus',
      message: `Low consensus confidence: ${metrics.averageConfidence.toFixed(2)}`,
      metrics,
    });
  }

  if (metrics.consensusSuccessRate < 0.8) {
    alerts.push({
      level: 'critical',
      category: 'consensus',
      message: `Low consensus success rate: ${(metrics.consensusSuccessRate * 100).toFixed(1)}%`,
      metrics,
    });
  }

  return alerts;
}

export function evaluateAllSafetyChecks(
  metrics: SafetyMetrics,
  thresholds: SafetyThresholds
): SafetyAlertDraft[] {
  return [
    ...evaluateErrorRates(metrics, thresholds),
    ...evaluateLatency(metrics, thresholds),
    ...evaluateMemoryUsage(metrics, thresholds),
    ...evaluateConsensusQuality(metrics, thresholds),
  ];
}
