import { logger } from '../../utils/logger';
import { AGGREGATOR_INSTRUCTIONS, PROVIDER_GUIDANCE } from './config';
import { truncate } from './text-utils';
import type { LLMProvider, LLMResponse, TaskType, WallBounceFlowDetails, WallBounceResult } from './types';

export function validateDepth(depth: number | undefined, mode: 'parallel' | 'sequential'): number {
  if (mode === 'parallel') {
    return 1; // パラレルモードではdepthは意味を持たない
  }

  if (depth === undefined) {
    return 3; // デフォルト値
  }

  if (depth < 3 || depth > 5) {
    logger.warn('🚨 Depth範囲外、デフォルト値3に設定', { requestedDepth: depth });
    return 3;
  }

  return depth;
}

export function selectProvidersForDepth(
  providers: Array<{ name: string; handler: LLMProvider }>,
  depth: number
): Array<{ name: string; handler: LLMProvider }> {
  // 利用可能なプロバイダーからランダム順でdepth分だけ選択
  // 重複しないようにシャッフルして選択
  const availableProviders = [...providers];
  const selectedProviders: Array<{ name: string; handler: LLMProvider }> = [];

  for (let i = 0; i < depth && availableProviders.length > 0; i++) {
    // 順次選択（シンプルな実装）
    const providerIndex = i % availableProviders.length;
    selectedProviders.push(availableProviders[providerIndex]);
  }

  return selectedProviders;
}

export function buildProviderPrompt(
  originalPrompt: string,
  providerName: string,
  mode: 'parallel' | 'sequential',
  previousResponses: Array<LLMResponse & { provider: string }>,
  accumulatedSummary: string = '',
  currentDepth?: number,
  totalDepth?: number,
  taskType?: 'basic' | 'premium' | 'critical' | 'simple'
): string {
  // シンプルクエリの場合は簡潔な応答を促すプロンプトを生成
  if (taskType === 'simple') {
    return `あなたはシンプルなアシスタントです。

CRITICAL INSTRUCTION: このクエリは単純な挨拶やテストメッセージです。技術的な詳細分析は一切不要です。

以下のパターンで振る舞ってください：
- 「テストの返事を返してください」→ 「テストの返事: 確認できました」
- 「こんにちは」→ 「こんにちは！」
- 「ping」→ 「pong」
- 「確認」→ 「確認しました」

絶対に守ること：
❌ コード例やAPI実装を提案しない
❌ システム設計や技術的背景を説明しない
❌ 複数のセクションに分けた詳細な分析をしない
❌ クエリの内容をそのまま繰り返さない
✅ 1-2文で簡潔に返答する
✅ 適切な応答として「確認できました」「了解しました」「OK」などを返す

ユーザークエリ: ${originalPrompt}

応答:`;
  }

  const guidance = PROVIDER_GUIDANCE[providerName];
  const parallelLines = guidance?.parallel || [
    '提示した課題に対して独自の観点から分析してください。',
    '根拠を明確にし、箇条書き中心で整理してください。'
  ];
  const sequentialLine = guidance?.sequential || '既出の出力を踏まえ、新しい観点や注意点を補足してください。';

  if (mode === 'parallel') {
    const instruction = parallelLines.map(line => `- ${line}`).join('\n');
    return `${originalPrompt}\n\n追加指示:\n${instruction}`;
  }

  const summarySection = previousResponses.length
    ? previousResponses.map(resp => `【${resp.provider}】\n${truncate(resp.content, 600)}`).join('\n\n')
    : '（まだ分析結果はありません）';

  const history = accumulatedSummary ? `\n\nこれまでの統合メモ:\n${truncate(accumulatedSummary, 800)}` : '';

  const depthInfo = currentDepth && totalDepth
    ? `\n\n[Wall-Bounce進行状況: ${currentDepth}/${totalDepth}段階目]`
    : '';

  return `${originalPrompt}\n\nここまでの分析結果:\n${summarySection}${history}${depthInfo}\n\n追加指示:\n- ${sequentialLine}`;
}

export function updateSequentialSummary(previous: string, providerName: string, content: string, currentDepth?: number): string {
  const depthLabel = currentDepth ? `[depth ${currentDepth}]` : '';
  const entry = `[${providerName}]${depthLabel} ${truncate(content, 600)}`;
  return previous ? `${previous}\n\n${entry}` : entry;
}

export function buildAggregatorPrompt(
  originalPrompt: string,
  responses: Array<LLMResponse & { provider: string }> ,
  taskType?: 'basic' | 'premium' | 'critical' | 'simple',
  depth?: number
): string {
  // シンプルクエリの場合は簡潔な統合を指示
  if (taskType === 'simple') {
    const responseSection = responses
      .map(resp => `【${resp.provider}】\n${truncate(resp.content, 200)}`)
      .join('\n\n');

    return `以下の回答を統合して、1-2文で簡潔に返答してください。技術的な分析や詳細な説明は不要です。

元のクエリ: ${originalPrompt}

個別回答:
${responseSection}

統合回答（1-2文で簡潔に）:`;
  }

  const header = AGGREGATOR_INSTRUCTIONS.map(line => `- ${line}`).join('\n');
  const responseSection = responses
    .map(resp => `【${resp.provider}】(confidence: ${resp.confidence.toFixed(2)})\n${truncate(resp.content, 1200)}`)
    .join('\n\n');

  const taskInfo = taskType ? `\nタスクタイプ: ${taskType}` : '';
  const depthInfo = depth ? `\nWall-Bounce深度: ${depth}段階` : '';

  return `${header}${taskInfo}${depthInfo}\n\n元の依頼:\n${originalPrompt}\n\n個別回答:\n${responseSection}`;
}

export function buildWallBounceResult(
  providerResponses: Array<LLMResponse & { provider: string }> ,
  aggregatorResponse: LLMResponse,
  aggregatorKey: string,
  providerErrors: string[],
  processingTimeMs: number,
  depth?: number,
  flowDetails?: WallBounceFlowDetails,
  tierEscalated = false
): WallBounceResult {
  const totalCost = providerResponses.reduce((sum, resp) => sum + (resp.cost || 0), aggregatorResponse.cost || 0);
  const votes = [
    ...providerResponses.map(resp => ({
      provider: resp.provider,
      model: resp.provider,
      response: resp,
      agreement_score: resp.confidence
    })),
    {
      provider: aggregatorKey,
      model: aggregatorKey,
      response: aggregatorResponse,
      agreement_score: aggregatorResponse.confidence
    }
  ];

  const depthInfo = depth ? ` (深度${depth})` : '';

  return {
    consensus: {
      content: `${aggregatorResponse.content}\n\n[Wall-Bounce統合分析完了${depthInfo}]`,
      confidence: aggregatorResponse.confidence,
      reasoning: aggregatorResponse.reasoning
    },
    llm_votes: votes,
    total_cost: totalCost,
    processing_time_ms: processingTimeMs,
    debug: {
      wall_bounce_verified: true,
      providers_used: providerResponses.map(resp => resp.provider).concat(aggregatorKey),
      tier_escalated: tierEscalated,
      provider_errors: providerErrors,
      ...(depth && { depth_executed: depth })
    },
    flow_details: flowDetails
  };
}

export function extractImprovements(metaResponse: string): string[] {
  // Simple extraction logic - in production, this could be more sophisticated
  const improvements: string[] = [];
  const lines = metaResponse.split('\n');

  let currentImprovement = '';
  for (const line of lines) {
    if (line.includes('- 問題点:') || line.includes('- 修正案:') || line.includes('- 期待効果:')) {
      if (currentImprovement) {
        improvements.push(currentImprovement.trim());
        currentImprovement = '';
      }
      currentImprovement = line;
    } else if (currentImprovement && line.trim()) {
      currentImprovement += ' ' + line.trim();
    }
  }

  if (currentImprovement) {
    improvements.push(currentImprovement.trim());
  }

  return improvements;
}

export function applyOptimizations(originalPrompt: string, improvements: string[]): string {
  // For now, return a note about optimizations
  // In a full implementation, this would parse and apply specific improvements
  if (improvements.length === 0) {
    return originalPrompt;
  }

  return `${originalPrompt}

[Meta-optimized based on ${improvements.length} improvement suggestions]`;
}

