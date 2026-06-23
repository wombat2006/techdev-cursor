import { logger } from '../../utils/logger';
import type { HuggingFaceError } from '../../types/huggingface';

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || (error as HuggingFaceError)?.retryable === false) {
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
