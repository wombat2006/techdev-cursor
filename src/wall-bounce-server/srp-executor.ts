import { shouldUseSRPArchitecture } from '../config/feature-flags';
import { wallBounceAdapter } from '../services/wall-bounce-adapter';
import { wallBounceAnalyzer, type WallBounceResult } from '../services/wall-bounce-analyzer';
import { logger } from '../utils/logger';

export async function executeWallBounceWithSRP(
  prompt: string,
  taskType: 'basic' | 'premium' | 'critical',
  options: {
    minProviders?: number;
    requireConsensus?: boolean;
    confidenceThreshold?: number;
    mode?: 'parallel' | 'sequential';
    depth?: number;
    maxProviders?: number;
  }
): Promise<WallBounceResult> {
  if (shouldUseSRPArchitecture()) {
    logger.info('🆕 Using SRP Wall-Bounce Architecture');
    return wallBounceAdapter.analyze(prompt, taskType, options);
  }

  logger.info('📞 Using Legacy Wall-Bounce Architecture');
  return wallBounceAnalyzer.executeWallBounce(prompt, {
    taskType,
    mode: options.mode,
    depth: options.depth,
    minProviders: options.minProviders,
    maxProviders: options.maxProviders,
  });
}
