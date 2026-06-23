import { estimateTokenCount } from '../huggingface-client/token-estimation';
import type { EmbeddingCacheEntry } from './types';

export function buildEmbeddingCacheKey(texts: string[], model: string): string {
  const textHash = texts.join('|');
  return `${model}:${Buffer.from(textHash).toString('base64')}`;
}

export function readEmbeddingCache(
  cache: Map<string, EmbeddingCacheEntry>,
  cacheKey: string,
  cacheTTL: number,
  now: number = Date.now()
): number[][] | null {
  const cached = cache.get(cacheKey);
  if (!cached || now - cached.timestamp >= cacheTTL) {
    return null;
  }
  return cached.embeddings;
}

export function writeEmbeddingCache(
  cache: Map<string, EmbeddingCacheEntry>,
  cacheKey: string,
  embeddings: number[][],
  now: number = Date.now()
): void {
  cache.set(cacheKey, { embeddings, timestamp: now });
}

export function estimateTextsTokenCount(texts: string[]): number {
  return estimateTokenCount(texts);
}
