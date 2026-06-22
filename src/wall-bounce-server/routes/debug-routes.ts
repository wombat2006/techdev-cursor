import type { Express } from 'express';
import { logger } from '../../utils/logger';
import { executeWallBounceWithSRP } from '../srp-executor';

export function registerDebugRoutes(app: Express): void {
  app.post('/api/v1/debug/wall-bounce', async (req, res) => {
  try {
    const { prompt, mode = 'sequential', depth = 3, task_type = 'basic' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required for debug analysis',
        code: 'MISSING_PROMPT'
      });
    }

    console.log('\n🐛 DEBUG MODE: Wall-Bounce詳細追跡を開始します...\n');

    const wallBounceResult = await executeWallBounceWithSRP(
      prompt,
      task_type as 'basic' | 'premium' | 'critical',
      { mode, depth, minProviders: 2 }
    );

    res.json({
      debug_mode: true,
      timestamp: new Date().toISOString(),
      user_query: prompt,
      configuration: { mode, depth, task_type },
      flow_details: wallBounceResult.flow_details,
      summary: {
        total_steps: wallBounceResult.flow_details?.llm_interactions.length || 0,
        providers_used: wallBounceResult.debug.providers_used,
        total_cost: wallBounceResult.total_cost,
        processing_time_ms: wallBounceResult.processing_time_ms,
        final_confidence: wallBounceResult.consensus.confidence
      },
      final_result: wallBounceResult.consensus.content
    });

  } catch (error) {
    logger.error('❌ Debug wall-bounce failed', { error });
    res.status(500).json({
      error: 'Debug analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
}
