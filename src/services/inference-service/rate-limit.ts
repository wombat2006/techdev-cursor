import type { RateLimitEntry } from './types';

export function checkRateLimit(
  requestCounts: Map<string, RateLimitEntry>,
  identifier: string,
  rateLimitPerMinute: number,
  now: number = Date.now()
): boolean {
  const rateLimitData = requestCounts.get(identifier);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }

  if (rateLimitData.count >= rateLimitPerMinute) {
    return false;
  }

  rateLimitData.count++;
  return true;
}
