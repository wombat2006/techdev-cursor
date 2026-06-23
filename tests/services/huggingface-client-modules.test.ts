import { mapAxiosErrorToHuggingFaceError } from '../../src/services/huggingface-client/api-error';
import { mapModelInfoResponse } from '../../src/services/huggingface-client/model-info';
import { retryWithBackoff } from '../../src/services/huggingface-client/retry-backoff';
import { estimateTokenCount } from '../../src/services/huggingface-client/token-estimation';

describe('huggingface-client SRP modules', () => {
  describe('shim exports', () => {
    it('re-exports HuggingFaceClient and factory from shim path', async () => {
      const mod = await import('../../src/services/huggingface-client');
      expect(mod.HuggingFaceClient).toBeDefined();
      expect(mod.createHuggingFaceClient).toBeDefined();
      expect(mod.default).toBe(mod.HuggingFaceClient);
    });
  });

  describe('token-estimation', () => {
    it('estimateTokenCount weights Japanese characters higher', () => {
      expect(estimateTokenCount('こんにちは')).toBeGreaterThan(estimateTokenCount('hello'));
    });

    it('estimateTokenCount sums array inputs', () => {
      const total = estimateTokenCount(['a', 'bb']);
      expect(total).toBe(estimateTokenCount('a') + estimateTokenCount('bb'));
    });
  });

  describe('api-error', () => {
    it('mapAxiosErrorToHuggingFaceError marks 429 as retryable', () => {
      const error = mapAxiosErrorToHuggingFaceError({
        message: 'rate limited',
        response: { status: 429, data: { error: 'Too Many Requests' } },
        config: { url: '/models/test-model' },
      } as never);

      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(429);
      expect(error.model).toBe('test-model');
    });
  });

  describe('model-info', () => {
    it('mapModelInfoResponse normalizes hub payload', () => {
      const info = mapModelInfoResponse({
        id: 'cl-tohoku/bert-base-japanese-v3',
        pipeline_tag: 'feature-extraction',
        downloads: 100,
        likes: 5,
        library_name: 'transformers',
        tags: ['japanese'],
        cardData: {
          description: 'Japanese BERT',
          language: ['ja'],
          license: 'apache-2.0',
        },
      });

      expect(info.id).toBe('cl-tohoku/bert-base-japanese-v3');
      expect(info.language).toEqual(['ja']);
      expect(info.license).toBe('apache-2.0');
    });
  });

  describe('retry-backoff', () => {
    it('retryWithBackoff succeeds after transient failure', async () => {
      let attempts = 0;
      const result = await retryWithBackoff(async () => {
        attempts++;
        if (attempts < 2) {
          const err = new Error('temporary') as Error & { retryable: boolean };
          err.retryable = true;
          throw err;
        }
        return 'ok';
      }, 2, 1);

      expect(result).toBe('ok');
      expect(attempts).toBe(2);
    });
  });
});
