import type { ConservativeMetrics, PhaseConfiguration, PhaseLevel, SafetyEvaluation } from './types';

export function evaluatePhaseHealth(
  metrics: ConservativeMetrics,
  config: PhaseConfiguration,
  currentPhase: PhaseLevel,
  phaseStartTime?: Date
): SafetyEvaluation {
  const issues: string[] = [];
  const positives: string[] = [];
  const recommendations: string[] = [];

  let status: SafetyEvaluation['status'] = 'healthy';

  if (metrics.errorRate >= config.thresholds.errorRate.emergency) {
    status = 'emergency';
    issues.push(`EMERGENCY: Error rate ${(metrics.errorRate * 100).toFixed(3)}%`);
  } else if (metrics.errorRate >= config.thresholds.errorRate.critical) {
    status = 'critical';
    issues.push(`CRITICAL: Error rate ${(metrics.errorRate * 100).toFixed(3)}%`);
  } else if (metrics.errorRate >= config.thresholds.errorRate.warning) {
    if (status === 'healthy') status = 'warning';
    issues.push(`WARNING: Error rate ${(metrics.errorRate * 100).toFixed(3)}%`);
  } else {
    positives.push(`Error rate healthy: ${(metrics.errorRate * 100).toFixed(3)}%`);
  }

  const phaseRuntime = phaseStartTime
    ? (Date.now() - phaseStartTime.getTime()) / (1000 * 60 * 60)
    : 0;

  const canProgressToNext =
    status === 'healthy' &&
    phaseRuntime >= config.stabilityRequirements.requiredStabilityHours &&
    metrics.stabilityScore > 0.8;

  const shouldRollbackToPrevious =
    status === 'critical' || (status === 'warning' && metrics.stabilityScore < 0.5);

  const shouldEmergencyStop = status === 'emergency';

  return {
    phase: currentPhase,
    status,
    canProgressToNext,
    shouldRollbackToPrevious,
    shouldEmergencyStop,
    issues,
    positiveIndicators: positives,
    recommendations,
    timeToNextEvaluation: config.stabilityRequirements.evaluationIntervalMinutes,
    requiredStabilityRemaining: Math.max(
      0,
      config.stabilityRequirements.requiredStabilityHours - phaseRuntime
    ),
  };
}
