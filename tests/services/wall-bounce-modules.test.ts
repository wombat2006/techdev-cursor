import {
  analyzeCognitiveDepth,
  analyzeDomainBreadth,
  analyzeStructuralComplexity,
  selectAggregatorByCognitiveAnalysis,
} from '../../src/services/wall-bounce/cognitive-analysis';
import { isSimpleQuery } from '../../src/services/wall-bounce/query-classifier';
import { validateDepth, buildWallBounceResult } from '../../src/services/wall-bounce/prompt-builder';

describe('wall-bounce SRP modules', () => {
  describe('query-classifier', () => {
    it('detects simple greetings', () => {
      expect(isSimpleQuery('こんにちは')).toBe(true);
      expect(isSimpleQuery('ping')).toBe(true);
    });

    it('rejects technical queries', () => {
      expect(isSimpleQuery('TypeScript API 設計')).toBe(false);
    });
  });

  describe('cognitive-analysis', () => {
    it('scores structural complexity from list density', () => {
      const prompt = '- a\n- b\n- c\n- d\n- e\n- f';
      expect(analyzeStructuralComplexity(prompt)).toBeGreaterThanOrEqual(2);
    });

    it('selects simple task aggregator from config', async () => {
      const key = await selectAggregatorByCognitiveAnalysis('hello', 'simple');
      expect(key).toBe('sonnet-4.6');
    });

    it('combines cognitive signals', () => {
      expect(analyzeCognitiveDepth('なぜこの設計か')).toBeGreaterThan(0);
      expect(analyzeDomainBreadth('セキュリティとパフォーマンス')).toBeGreaterThan(0);
    });
  });

  describe('prompt-builder', () => {
    it('validateDepth clamps sequential range', () => {
      expect(validateDepth(undefined, 'sequential')).toBe(3);
      expect(validateDepth(99, 'sequential')).toBe(3);
      expect(validateDepth(4, 'sequential')).toBe(4);
      expect(validateDepth(2, 'parallel')).toBe(1);
    });

    it('buildWallBounceResult marks tier escalation', () => {
      const result = buildWallBounceResult(
        [
          {
            provider: 'gpt-5',
            content: 'a',
            confidence: 0.9,
            reasoning: '',
            cost: 0,
            tokens: { input: 1, output: 1 },
          },
        ],
        {
          content: 'final',
          confidence: 0.85,
          reasoning: 'ok',
          cost: 0.01,
          tokens: { input: 1, output: 1 },
        },
        'opus-4.8',
        [],
        100,
        undefined,
        undefined,
        true
      );
      expect(result.debug.tier_escalated).toBe(true);
      expect(result.consensus.content).toContain('final');
    });
  });
});
