import { buildSystemContext, prepareContextualInput } from '../../src/services/inference-service/context-builder';
import { calculateInferenceCost } from '../../src/services/inference-service/cost';
import {
  getDefaultMaxTokens,
  selectInferenceModel,
} from '../../src/services/inference-service/model-selection';
import { checkRateLimit } from '../../src/services/inference-service/rate-limit';
import {
  analyzeInferenceResponse,
  calculateConfidence,
  calculateRelevance,
} from '../../src/services/inference-service/response-analysis';
import { postProcessInferenceResponse } from '../../src/services/inference-service/response-processing';
import { TaskType } from '../../src/types/huggingface';
import { createDefaultModelTiers } from '../../src/services/inference-service/config';

describe('inference-service SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports InferenceService from shim path', async () => {
      const mod = await import('../../src/services/inference-service');
      expect(mod.InferenceService).toBeDefined();
      expect(mod.default).toBe(mod.InferenceService);
    });
  });

  describe('model-selection', () => {
    const tiers = createDefaultModelTiers();

    it('selectInferenceModel prefers valid preferred model', () => {
      const preferred = tiers[TaskType.BASIC][0];
      expect(selectInferenceModel(tiers, TaskType.BASIC, 'default', preferred)).toBe(preferred);
    });

    it('getDefaultMaxTokens scales with task type', () => {
      expect(getDefaultMaxTokens(TaskType.CRITICAL)).toBeGreaterThan(getDefaultMaxTokens(TaskType.BASIC));
    });
  });

  describe('context-builder', () => {
    it('prepareContextualInput prepends Japanese enforcement', () => {
      const input = prepareContextualInput({
        inputs: 'hello',
        model: 'test-model',
        options: { enforceJapanese: true },
      });
      expect(input).toContain('日本語で回答してください');
    });

    it('buildSystemContext adds critical urgency text', () => {
      expect(buildSystemContext(TaskType.CRITICAL)).toContain('緊急度');
    });
  });

  describe('response-analysis', () => {
    it('calculateConfidence increases for technical Japanese text', () => {
      const score = calculateConfidence('サーバ障害のエラー設定を解決しました。', {
        inputs: 'test',
        model: 'm',
        taskType: TaskType.CRITICAL,
      });
      expect(score).toBeGreaterThan(0.6);
    });

    it('calculateRelevance rewards overlapping terms', () => {
      expect(calculateRelevance('server error fix', 'server error')).toBeGreaterThan(0);
    });

    it('analyzeInferenceResponse returns bounded scores', () => {
      const analysis = analyzeInferenceResponse('システムエラーを確認しました。', {
        inputs: 'server error',
        model: 'm',
      });
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(analysis.relevance).toBeLessThanOrEqual(1);
    });
  });

  describe('rate-limit', () => {
    it('checkRateLimit blocks after threshold', () => {
      const counts = new Map();
      expect(checkRateLimit(counts, 'user-1', 2, 1_000)).toBe(true);
      expect(checkRateLimit(counts, 'user-1', 2, 1_000)).toBe(true);
      expect(checkRateLimit(counts, 'user-1', 2, 1_000)).toBe(false);
    });
  });

  describe('cost', () => {
    it('calculateInferenceCost returns positive totals', () => {
      const cost = calculateInferenceCost(
        {
          generated_text: 'ok',
          model: 'm',
          usage: { inputTokens: 10, outputTokens: 20, processingTime: 1 },
        },
        'm'
      );
      expect(cost.totalCost).toBeGreaterThan(0);
    });
  });

  describe('response-processing', () => {
    it('postProcessInferenceResponse strips assistant prefix', () => {
      const processed = postProcessInferenceResponse(
        {
          generated_text: 'Assistant: 回答です',
          model: 'm',
          usage: { inputTokens: 1, outputTokens: 1, processingTime: 1 },
        },
        { inputs: 'q', model: 'm' }
      );
      expect(processed.generated_text).toBe('回答です');
    });
  });
});
