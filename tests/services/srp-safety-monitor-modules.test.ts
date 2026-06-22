import { buildSafetyAlert, getActionRequiredForAlert } from '../../src/services/srp-safety-monitor/alerts';
import { loadSafetyThresholds } from '../../src/services/srp-safety-monitor/thresholds';
import {
  evaluateErrorRates,
  evaluateMemoryUsage,
} from '../../src/services/srp-safety-monitor/safety-evaluations';
import type { SafetyMetrics } from '../../src/services/srp-safety-monitor/types';

describe('srp-safety-monitor SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports SRPSafetyMonitor from shim path', async () => {
      const mod = await import('../../src/services/srp-safety-monitor');
      expect(mod.SRPSafetyMonitor).toBeDefined();
      expect(mod.SRPSafetyMonitor.getInstance).toBeDefined();
    });
  });

  describe('thresholds', () => {
    it('loadSafetyThresholds applies defaults', () => {
      const thresholds = loadSafetyThresholds();
      expect(thresholds.warningErrorRate).toBe(0.01);
      expect(thresholds.criticalMemory).toBe(95);
    });
  });

  describe('safety-evaluations', () => {
    const baseMetrics: SafetyMetrics = {
      timestamp: new Date(),
      totalRequests: 100,
      srpRequests: 10,
      errorCount: 0,
      srpErrorCount: 0,
      avgLatency: 1000,
      srpAvgLatency: 1000,
      memoryUsagePercent: 50,
      consensusSuccessRate: 0.95,
      averageConfidence: 0.8,
      providersHealthy: 4,
      errorRate: 0,
      srpErrorRate: 0,
      srp5MinuteErrorRate: 0,
    };

    it('evaluateErrorRates triggers emergency on critical rate', () => {
      const thresholds = loadSafetyThresholds();
      const alerts = evaluateErrorRates(
        { ...baseMetrics, errorRate: 0.1 },
        thresholds
      );
      expect(alerts.some((a) => a.level === 'emergency')).toBe(true);
    });

    it('evaluateMemoryUsage warns on high memory', () => {
      const thresholds = loadSafetyThresholds();
      const alerts = evaluateMemoryUsage(
        { ...baseMetrics, memoryUsagePercent: 85 },
        thresholds
      );
      expect(alerts.some((a) => a.category === 'memory')).toBe(true);
    });
  });

  describe('alerts', () => {
    it('getActionRequiredForAlert returns rollback for emergency', () => {
      expect(getActionRequiredForAlert('emergency', 'error_rate')).toBe(
        'IMMEDIATE AUTO-ROLLBACK'
      );
    });

    it('buildSafetyAlert attaches actionRequired', () => {
      const alert = buildSafetyAlert({
        level: 'warning',
        category: 'latency',
        message: 'High latency',
        metrics: {},
      });
      expect(alert.actionRequired).toBe('Increase monitoring frequency');
      expect(alert.timestamp).toBeInstanceOf(Date);
    });
  });
});
