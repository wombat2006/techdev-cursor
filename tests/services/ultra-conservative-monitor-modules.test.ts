import { buildPhaseConfigurations, getPreviousPhase } from '../../src/services/ultra-conservative-monitor/phase-configurations';
import { calculateVariance } from '../../src/services/ultra-conservative-monitor/math-utils';
import { evaluatePhaseHealth } from '../../src/services/ultra-conservative-monitor/health-evaluation';
import type { ConservativeMetrics } from '../../src/services/ultra-conservative-monitor/types';

describe('ultra-conservative-monitor SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports UltraConservativeMonitor from shim path', async () => {
      const mod = await import('../../src/services/ultra-conservative-monitor');
      expect(mod.UltraConservativeMonitor).toBeDefined();
      expect(mod.UltraConservativeMonitor.getInstance).toBeDefined();
    });
  });

  describe('phase-configurations', () => {
    it('buildPhaseConfigurations defines 1%, 2%, and 5% phases', () => {
      const phases = buildPhaseConfigurations();
      expect(phases.size).toBe(3);
      expect(phases.get('1percent')?.trafficPercentage).toBe(1);
      expect(phases.get('5percent')?.trafficPercentage).toBe(5);
    });

    it('getPreviousPhase walks down the rollout ladder', () => {
      expect(getPreviousPhase('5percent')).toBe('2percent');
      expect(getPreviousPhase('2percent')).toBe('1percent');
      expect(getPreviousPhase('1percent')).toBeNull();
    });
  });

  describe('math-utils', () => {
    it('calculateVariance returns 0 for identical values', () => {
      expect(calculateVariance([2, 2, 2])).toBe(0);
    });
  });

  describe('health-evaluation', () => {
    it('evaluatePhaseHealth marks low error rate as healthy', () => {
      const phases = buildPhaseConfigurations();
      const config = phases.get('1percent')!;
      const metrics: ConservativeMetrics = {
        timestamp: new Date(),
        phase: '1percent',
        totalRequests: 100,
        srpRequests: 1,
        errorCount: 0,
        srpErrorCount: 0,
        avgLatency: 2000,
        p95Latency: 3000,
        p99Latency: 4000,
        memoryUsagePercent: 50,
        consensusSuccessRate: 0.95,
        averageConfidence: 0.8,
        providerFailures: {},
        errorRate: 0.001,
        srpErrorRate: 0.001,
        latencyFromBaseline: 0,
        stabilityScore: 0.9,
      };

      const evaluation = evaluatePhaseHealth(metrics, config, '1percent', new Date());
      expect(evaluation.status).toBe('healthy');
      expect(evaluation.shouldEmergencyStop).toBe(false);
    });
  });
});
