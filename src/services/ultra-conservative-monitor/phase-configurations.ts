import type { PhaseConfiguration, PhaseLevel } from './types';

export function buildPhaseConfigurations(): Map<PhaseLevel, PhaseConfiguration> {
  const phases = new Map<PhaseLevel, PhaseConfiguration>();

  phases.set('1percent', {
    level: '1percent',
    trafficPercentage: 1,
    description: 'Baseline 1% Phase',
    thresholds: {
      errorRate: { warning: 0.008, critical: 0.015, emergency: 0.025 },
      latency: { warning: 3500, critical: 5000, emergency: 7000 },
      memory: { warning: 75, critical: 85, emergency: 95 },
      consensus: { minWarning: 0.9, minCritical: 0.8, minEmergency: 0.7 },
    },
    stabilityRequirements: {
      minDurationHours: 2,
      requiredStabilityHours: 2,
      evaluationIntervalMinutes: 5,
    },
  });

  phases.set('2percent', {
    level: '2percent',
    trafficPercentage: 2,
    description: 'Conservative 2% Phase',
    thresholds: {
      errorRate: { warning: 0.005, critical: 0.01, emergency: 0.02 },
      latency: { warning: 3000, critical: 4500, emergency: 6000 },
      memory: { warning: 70, critical: 80, emergency: 90 },
      consensus: { minWarning: 0.92, minCritical: 0.85, minEmergency: 0.75 },
    },
    stabilityRequirements: {
      minDurationHours: 8,
      requiredStabilityHours: 6,
      evaluationIntervalMinutes: 3,
    },
  });

  phases.set('5percent', {
    level: '5percent',
    trafficPercentage: 5,
    description: 'Full 5% Phase',
    thresholds: {
      errorRate: { warning: 0.003, critical: 0.008, emergency: 0.015 },
      latency: { warning: 2500, critical: 4000, emergency: 5500 },
      memory: { warning: 65, critical: 75, emergency: 85 },
      consensus: { minWarning: 0.95, minCritical: 0.88, minEmergency: 0.8 },
    },
    stabilityRequirements: {
      minDurationHours: 24,
      requiredStabilityHours: 12,
      evaluationIntervalMinutes: 2,
    },
  });

  return phases;
}

export function getPreviousPhase(currentPhase: PhaseLevel): PhaseLevel | null {
  switch (currentPhase) {
    case '5percent':
      return '2percent';
    case '2percent':
      return '1percent';
    case '1percent':
    default:
      return null;
  }
}

export function getTrafficPercentage(
  phases: Map<PhaseLevel, PhaseConfiguration>,
  currentPhase: PhaseLevel
): number {
  return phases.get(currentPhase)?.trafficPercentage || 1;
}
