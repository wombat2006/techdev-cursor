import type { Express } from 'express';
import { logger } from '../../utils/logger';
import { executeWallBounceWithSRP } from '../srp-executor';

export function registerLogAnalysisRoutes(app: Express): void {
  app.post('/api/v1/analyze-logs', async (req, res) => {
  try {
    const { user_command, error_output, system_context } = req.body;

    if (!user_command || !error_output) {
      return res.status(400).json({ 
        error: 'user_command and error_output are required',
        code: 'MISSING_REQUIRED_FIELDS',
        required_fields: ['user_command', 'error_output']
      });
    }

    logger.info('🔍 ログ解析開始', {
      command: user_command,
      error_length: error_output.length,
      has_context: !!system_context
    });

    // ログ解析専用プロンプト構築
    const analysisPrompt = `
システム管理ログ解析:

実行コマンド: ${user_command}
エラー出力: ${error_output}
システム情報: ${system_context || 'N/A'}

以下の観点で分析してください:
1. エラーの根本原因
2. 即座に実行すべき対処法
3. 予防策
4. 関連する設定ファイルやサービス
5. 重要度とビジネス影響度
`;

    // 壁打ち分析実行 - SRP対応
    const wallBounceResult = await executeWallBounceWithSRP(
      analysisPrompt,
      'premium', // ログ解析はプレミアムレベル
      {
        minProviders: 3,
        requireConsensus: true,
        confidenceThreshold: 0.85
      }
    );

    const analysis = {
      analysis_result: {
        command: user_command,
        error: error_output,
        context: system_context,
        root_cause: wallBounceResult.consensus.content,
        confidence: wallBounceResult.consensus.confidence,
        reasoning: wallBounceResult.consensus.reasoning,
        severity: wallBounceResult.consensus.confidence > 0.9 ? 'high' : 
                 wallBounceResult.consensus.confidence > 0.7 ? 'medium' : 'low'
      },
      wall_bounce_analysis: {
        providers_used: wallBounceResult.debug.providers_used,
        consensus_confidence: wallBounceResult.consensus.confidence,
        llm_agreement: wallBounceResult.llm_votes.map(vote => ({
          provider: vote.provider,
          confidence: vote.response.confidence,
          agreement_score: vote.agreement_score
        })),
        total_cost: wallBounceResult.total_cost,
        processing_time_ms: wallBounceResult.processing_time_ms
      },
      timestamp: new Date().toISOString()
    };

    logger.info('✅ ログ解析完了', {
      confidence: wallBounceResult.consensus.confidence,
      providers_count: wallBounceResult.debug.providers_used.length,
      severity: analysis.analysis_result.severity
    });

    res.json(analysis);
  } catch (error) {
    logger.error('❌ ログ解析エラー', { error });
    res.status(500).json({
      error: 'ログ解析に失敗しました',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});
}
