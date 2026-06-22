import type { Express } from 'express';
import { WallBounceMetricsCollector } from '../../middleware/metrics-middleware';
import { logger } from '../../utils/logger';
import type { WallBounceResult } from '../../services/wall-bounce-analyzer';
import { executeWallBounceWithSRP } from '../srp-executor';

export function registerGenerateRoutes(app: Express): void {
  app.post('/api/v1/generate', async (req, res) => {
  const metricsCollector = WallBounceMetricsCollector.getInstance();
  const sessionId = req.body.session_id || `sess_${Date.now()}`;

  try {
    const { prompt, task_type = 'basic', user_id, mode = 'parallel', depth } = req.body;
    metricsCollector.startAnalysis(sessionId);

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        code: 'MISSING_PROMPT',
        required_fields: ['prompt']
      });
    }

    if (task_type && !['basic', 'premium', 'critical'].includes(task_type)) {
      return res.status(400).json({
        error: 'Invalid task_type. Must be: basic, premium, critical',
        code: 'INVALID_TASK_TYPE'
      });
    }

    if (mode && !['parallel', 'sequential'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Must be: parallel, sequential',
        code: 'INVALID_MODE'
      });
    }

    if (depth !== undefined && (depth < 3 || depth > 5)) {
      return res.status(400).json({
        error: 'Invalid depth. Must be between 3 and 5 for sequential mode',
        code: 'INVALID_DEPTH'
      });
    }

    logger.info('🔄 技術支援クエリ開始', {
      task_type,
      mode,
      depth: mode === 'sequential' ? depth : 'N/A',
      user_id,
      session_id: sessionId,
      prompt_length: prompt.length
    });

    // 壁打ち分析実行（必須）- SRP対応
    const wallBounceResult: WallBounceResult = await executeWallBounceWithSRP(
      `IT Infrastructure問題分析: ${prompt}`,
      task_type as 'basic' | 'premium' | 'critical',
      {
        minProviders: task_type === 'basic' ? 2 : task_type === 'premium' ? 3 : 4,
        requireConsensus: task_type !== 'basic',
        confidenceThreshold: task_type === 'critical' ? 0.9 : 0.8,
        mode: mode as 'parallel' | 'sequential',
        depth
      }
    );

    const response = {
      response: wallBounceResult.consensus.content,
      confidence: wallBounceResult.consensus.confidence,
      flow_details: wallBounceResult.flow_details,
      reasoning: wallBounceResult.consensus.reasoning,
      session_id: sessionId,
      task_type,
      wall_bounce_analysis: {
        providers_used: wallBounceResult.debug.providers_used,
        llm_votes: wallBounceResult.llm_votes.map(vote => ({
          provider: vote.provider,
          model: vote.model,
          confidence: vote.response.confidence,
          agreement_score: vote.agreement_score
        })),
        total_cost: wallBounceResult.total_cost,
        processing_time_ms: wallBounceResult.processing_time_ms,
        tier_escalated: wallBounceResult.debug.tier_escalated
      },
      timestamp: new Date().toISOString()
    };

    // メトリクス収集完了
    metricsCollector.endAnalysis(sessionId, wallBounceResult);

    logger.info('✅ 技術支援完了', {
      task_type,
      confidence: wallBounceResult.consensus.confidence,
      providers_count: wallBounceResult.debug.providers_used.length,
      cost: wallBounceResult.total_cost
    });

    res.json(response);
  } catch (error) {
    logger.error('❌ 技術支援エラー', { error });
    res.status(500).json({
      error: '技術支援処理に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});
}
