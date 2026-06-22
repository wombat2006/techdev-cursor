import { assessRiskLevel, buildContextPrompt } from '../../src/services/codex-mcp/prompt-utils';
import { CodexPerformanceStore } from '../../src/services/codex-mcp/performance-store';
import { mergeCodexMCPConfig } from '../../src/services/codex-mcp/types';

describe('codex-mcp SRP modules', () => {
  describe('prompt-utils', () => {
    it('assessRiskLevel escalates full-auto full-access', () => {
      expect(assessRiskLevel('full-access', true, 'ci')).toBe('critical');
      expect(assessRiskLevel('read-only', false, 'interactive')).toBe('low');
    });

    it('buildContextPrompt includes recent history', () => {
      const prompt = buildContextPrompt(
        [{ type: 'user', content: 'first' }, { type: 'assistant', content: 'reply' }],
        'follow up'
      );
      expect(prompt).toContain('follow up');
      expect(prompt).toContain('first');
    });
  });

  describe('performance-store', () => {
    it('caches read-only session info responses', () => {
      const store = new CodexPerformanceStore(mergeCodexMCPConfig({ cache_ttl_ms: 60_000 }));
      const key = store.generateCacheKey('codex-session-info', { list_active: true });
      const result = { content: [{ type: 'text' as const, text: '{}' }] };
      store.cacheResponse(key, result);
      expect(store.getCachedResponse(key)?.content[0].text).toBe('{}');
    });
  });
});
