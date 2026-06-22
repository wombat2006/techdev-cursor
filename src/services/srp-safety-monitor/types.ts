export interface SafetyThresholds {
  warningErrorRate: number;
  criticalErrorRate: number;
  warningLatency: number;
  criticalLatency: number;
  warningMemory: number;
  criticalMemory: number;
  minConsensusConfidence: number;
  minAgreementScore: number;
}

export interface SafetyMetrics {
  timestamp: Date;
  totalRequests: number;
  srpRequests: number;
  errorCount: number;
  srpErrorCount: number;
  avgLatency: number;
  srpAvgLatency: number;
  memoryUsagePercent: number;
  consensusSuccessRate: number;
  averageConfidence: number;
  providersHealthy: number;
  errorRate: number;
  srpErrorRate: number;
  srp5MinuteErrorRate: number;
}

export interface SafetyAlert {
  level: 'info' | 'warning' | 'critical' | 'emergency';
  category: 'error_rate' | 'latency' | 'memory' | 'consensus' | 'system';
  message: string;
  metrics: Partial<SafetyMetrics>;
  timestamp: Date;
  actionRequired?: string;
}

export interface SafetyAlertDraft {
  level: SafetyAlert['level'];
  category: SafetyAlert['category'];
  message: string;
  metrics: Partial<SafetyMetrics>;
}
