export type PhaseLevel = '1percent' | '2percent' | '5percent';

export interface PhaseConfiguration {
  level: PhaseLevel;
  trafficPercentage: number;
  description: string;
  thresholds: {
    errorRate: {
      warning: number;
      critical: number;
      emergency: number;
    };
    latency: {
      warning: number;
      critical: number;
      emergency: number;
    };
    memory: {
      warning: number;
      critical: number;
      emergency: number;
    };
    consensus: {
      minWarning: number;
      minCritical: number;
      minEmergency: number;
    };
  };
  stabilityRequirements: {
    minDurationHours: number;
    requiredStabilityHours: number;
    evaluationIntervalMinutes: number;
  };
}

export interface ConservativeMetrics {
  timestamp: Date;
  phase: PhaseLevel;
  totalRequests: number;
  srpRequests: number;
  errorCount: number;
  srpErrorCount: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  memoryUsagePercent: number;
  consensusSuccessRate: number;
  averageConfidence: number;
  providerFailures: Record<string, number>;
  errorRate: number;
  srpErrorRate: number;
  latencyFromBaseline: number;
  stabilityScore: number;
}

export interface SafetyEvaluation {
  phase: PhaseLevel;
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
  canProgressToNext: boolean;
  shouldRollbackToPrevious: boolean;
  shouldEmergencyStop: boolean;
  issues: string[];
  positiveIndicators: string[];
  recommendations: string[];
  timeToNextEvaluation: number;
  requiredStabilityRemaining: number;
}

export interface PreTransitionCheckResult {
  safe: boolean;
  issues: string[];
  positives: string[];
}
