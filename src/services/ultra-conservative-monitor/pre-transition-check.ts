import { getTrafficPercentage } from './phase-configurations';
import type {
  ConservativeMetrics,
  PhaseConfiguration,
  PhaseLevel,
  PreTransitionCheckResult,
} from './types';

export function performPreTransitionSafetyCheck(
  currentMetrics: ConservativeMetrics,
  currentPhase: PhaseLevel,
  targetPhase: PhaseLevel,
  phases: Map<PhaseLevel, PhaseConfiguration>,
  phaseStartTime?: Date
): PreTransitionCheckResult {
  const currentConfig = phases.get(currentPhase)!;
  const targetConfig = phases.get(targetPhase)!;

  const issues: string[] = [];
  const positives: string[] = [];

  if (currentMetrics.errorRate > currentConfig.thresholds.errorRate.warning) {
    issues.push(`Current error rate too high: ${(currentMetrics.errorRate * 100).toFixed(3)}%`);
  } else {
    positives.push(`Error rate healthy: ${(currentMetrics.errorRate * 100).toFixed(3)}%`);
  }

  if (currentMetrics.avgLatency > currentConfig.thresholds.latency.warning) {
    issues.push(`Current latency too high: ${currentMetrics.avgLatency}ms`);
  } else {
    positives.push(`Latency healthy: ${currentMetrics.avgLatency}ms`);
  }

  if (currentMetrics.memoryUsagePercent > currentConfig.thresholds.memory.warning) {
    issues.push(`Memory usage concerning: ${currentMetrics.memoryUsagePercent}%`);
  } else {
    positives.push(`Memory usage good: ${currentMetrics.memoryUsagePercent}%`);
  }

  if (currentMetrics.consensusSuccessRate < currentConfig.thresholds.consensus.minWarning) {
    issues.push(
      `Consensus rate too low: ${(currentMetrics.consensusSuccessRate * 100).toFixed(1)}%`
    );
  } else {
    positives.push(
      `Consensus rate strong: ${(currentMetrics.consensusSuccessRate * 100).toFixed(1)}%`
    );
  }

  if (phaseStartTime) {
    const phaseRuntime = (Date.now() - phaseStartTime.getTime()) / (1000 * 60 * 60);
    if (phaseRuntime < currentConfig.stabilityRequirements.requiredStabilityHours) {
      issues.push(
        `Insufficient stability time: ${phaseRuntime.toFixed(1)}h < ${currentConfig.stabilityRequirements.requiredStabilityHours}h required`
      );
    } else {
      positives.push(`Stability requirement met: ${phaseRuntime.toFixed(1)}h`);
    }
  }

  const currentTraffic = getTrafficPercentage(phases, currentPhase);
  const trafficMultiplier = targetConfig.trafficPercentage / currentTraffic;
  if (trafficMultiplier > 3) {
    issues.push(`Traffic increase too aggressive: ${trafficMultiplier}x`);
  } else if (trafficMultiplier > 2) {
    positives.push(`Traffic increase significant but manageable: ${trafficMultiplier}x`);
  } else {
    positives.push(`Conservative traffic increase: ${trafficMultiplier}x`);
  }

  return {
    safe: issues.length === 0,
    issues,
    positives,
  };
}
