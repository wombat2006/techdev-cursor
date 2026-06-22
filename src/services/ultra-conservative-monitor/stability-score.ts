import { calculateVariance } from './math-utils';
import type { ConservativeMetrics, PhaseConfiguration, PhaseLevel } from './types';

export function calculateStabilityScore(
  metricsHistory: ConservativeMetrics[],
  currentPhase: PhaseLevel,
  phases: Map<PhaseLevel, PhaseConfiguration>
): number {
  if (metricsHistory.length < 5) return 0.5;

  const recent = metricsHistory.slice(-10);
  const config = phases.get(currentPhase)!;

  const errorRates = recent.map((m) => m.errorRate);
  const latencies = recent.map((m) => m.avgLatency);

  const errorVariance = calculateVariance(errorRates);
  const latencyVariance = calculateVariance(latencies);

  const errorStability = Math.max(0, 1 - errorVariance * 10000);
  const latencyStability = Math.max(0, 1 - latencyVariance / 1000000);

  const thresholdCompliance =
    recent.filter(
      (m) =>
        m.errorRate < config.thresholds.errorRate.warning &&
        m.avgLatency < config.thresholds.latency.warning &&
        m.consensusSuccessRate > config.thresholds.consensus.minWarning
    ).length / recent.length;

  return Math.min(1, (errorStability + latencyStability + thresholdCompliance) / 3);
}
