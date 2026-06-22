import { LogAnalyzer } from '../../src/services/log-analyzer';
import { detectLogType } from '../../src/services/log-analyzer/error-context';
import { analyzeGeneralLogs } from '../../src/services/log-analyzer/domain-analyzers';

describe('log-analyzer SRP modules', () => {
  describe('error-context', () => {
    it('detectLogType classifies systemd service failures', () => {
      const output = 'nginx.service: Failed to start. control process exited, code=dumped';
      expect(detectLogType(output, 'systemctl status nginx')).toBe('systemd');
    });
  });

  describe('domain-analyzers', () => {
    it('analyzeGeneralLogs returns structured fallback result', () => {
      const result = analyzeGeneralLogs('unknown error in application', 'app start');
      expect(result.issue_identified).toBe(true);
      expect(result.solution_steps.length).toBeGreaterThan(0);
      expect(result.confidence_score).toBeGreaterThan(0);
    });
  });

  describe('shim export', () => {
    it('LogAnalyzer.analyzeLogs is wired to analyze-entry', () => {
      expect(typeof LogAnalyzer.analyzeLogs).toBe('function');
    });
  });
});
