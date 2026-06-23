import { createTextBatches } from '../../src/services/embedding-service/batch-utils';
import { buildEmbeddingCacheKey, writeEmbeddingCache, readEmbeddingCache } from '../../src/services/embedding-service/cache';
import {
  detectSpecializedTerms,
  getRecommendedEmbeddingModel,
} from '../../src/services/embedding-service/model-selection';
import {
  calculateCosineSimilarity,
  compareEmbeddingModelResults,
} from '../../src/services/embedding-service/similarity';
import { TaskType } from '../../src/types/huggingface';

describe('embedding-service SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports EmbeddingService from shim path', async () => {
      const mod = await import('../../src/services/embedding-service');
      expect(mod.EmbeddingService).toBeDefined();
      expect(mod.default).toBe(mod.EmbeddingService);
    });
  });

  describe('batch-utils', () => {
    it('createTextBatches splits by max size', () => {
      expect(createTextBatches(['a', 'b', 'c', 'd'], 2)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });
  });

  describe('cache', () => {
    it('readEmbeddingCache returns null when entry expired', () => {
      const cache = new Map();
      const key = buildEmbeddingCacheKey(['hello'], 'model-a');
      writeEmbeddingCache(cache, key, [[1, 2]], Date.now() - 10_000);
      expect(readEmbeddingCache(cache, key, 1000)).toBeNull();
    });
  });

  describe('model-selection', () => {
    it('detectSpecializedTerms matches IT incident vocabulary', () => {
      expect(detectSpecializedTerms('サーバ障害のログ調査')).toBe(true);
      expect(detectSpecializedTerms('今日の天気')).toBe(false);
    });

    it('getRecommendedEmbeddingModel prefers sentence model for short text', () => {
      const model = getRecommendedEmbeddingModel('短い文');
      expect(model.useCase).toBe('sentence');
    });

    it('getRecommendedEmbeddingModel prefers tohoku-bert for critical tasks', () => {
      const model = getRecommendedEmbeddingModel('任意', TaskType.CRITICAL);
      expect(model.id).toBe('tohoku-bert-v3');
    });
  });

  describe('similarity', () => {
    it('calculateCosineSimilarity returns 1 for identical vectors', () => {
      expect(calculateCosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    });

    it('compareEmbeddingModelResults picks best model', () => {
      const comparison = compareEmbeddingModelResults(
        [
          {
            model: 'a',
            embeddings: [[1, 0]],
            dimensions: 2,
            metadata: { modelInfo: {} as never, processingTime: 100, tokenCount: 1 },
          },
          {
            model: 'b',
            embeddings: [[1, 0]],
            dimensions: 2,
            metadata: { modelInfo: {} as never, processingTime: 50, tokenCount: 1 },
          },
        ],
        ['test']
      );

      expect(comparison?.bestModel).toBe('b');
      expect(comparison?.averageSimilarity).toBeCloseTo(1);
    });
  });
});
