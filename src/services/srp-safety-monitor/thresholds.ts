import type { SafetyThresholds } from './types';

export function loadSafetyThresholds(): SafetyThresholds {
  return {
    warningErrorRate: parseFloat(process.env.SRP_ERROR_RATE_THRESHOLD || '0.01'),
    criticalErrorRate: parseFloat(process.env.AUTO_ROLLBACK_ERROR_RATE || '0.05'),
    warningLatency: parseInt(process.env.SRP_LATENCY_THRESHOLD_MS || '5000', 10),
    criticalLatency: parseInt(process.env.AUTO_ROLLBACK_LATENCY_MS || '8000', 10),
    warningMemory: parseInt(process.env.SRP_MEMORY_USAGE_THRESHOLD || '80', 10),
    criticalMemory: 95,
    minConsensusConfidence: 0.6,
    minAgreementScore: 0.7,
  };
}
