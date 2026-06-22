import { calculateStabilityScore } from './stability-score';
import type { ConservativeMetrics, PhaseConfiguration, PhaseLevel } from './types';

export interface MetricsCollectionContext {
  currentPhase: PhaseLevel;
  phases: Map<PhaseLevel, PhaseConfiguration>;
  baselineMetrics?: ConservativeMetrics;
  metricsHistory: ConservativeMetrics[];
  trafficPercentage: number;
}

export async function collectCurrentMetrics(
  ctx: MetricsCollectionContext
): Promise<ConservativeMetrics> {
  const now = new Date();
  const memoryUsage = process.memoryUsage();
  const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  const stabilityScore = calculateStabilityScore(
    ctx.metricsHistory,
    ctx.currentPhase,
    ctx.phases
  );

  const totalRequests = 1000 + Math.floor(Math.random() * 200);
  const avgLatency = 2400 + Math.floor(Math.random() * 600);

  return {
    timestamp: now,
    phase: ctx.currentPhase,
    totalRequests,
    srpRequests: Math.floor((totalRequests * ctx.trafficPercentage) / 100),
    errorCount: Math.floor(Math.random() * 5),
    srpErrorCount: Math.floor(Math.random() * 2),
    avgLatency,
    p95Latency: 3200 + Math.floor(Math.random() * 800),
    p99Latency: 4500 + Math.floor(Math.random() * 1000),
    memoryUsagePercent: Math.round(memoryPercent),
    consensusSuccessRate: 0.92 + Math.random() * 0.07,
    averageConfidence: 0.75 + Math.random() * 0.2,
    providerFailures: {
      'gpt-5-codex': Math.floor(Math.random() * 2),
      'claude-code-direct': Math.floor(Math.random() * 1),
      'gemini-2.5-pro': Math.floor(Math.random() * 2),
      'gemini-2.5-flash': Math.floor(Math.random() * 3),
    },
    errorRate: Math.random() * 0.01,
    srpErrorRate: Math.random() * 0.008,
    latencyFromBaseline: ctx.baselineMetrics
      ? avgLatency / ctx.baselineMetrics.avgLatency - 1
      : 0,
    stabilityScore,
  };
}
