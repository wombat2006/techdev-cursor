import { logger } from '../../utils/logger';
import { providersConfig } from './config';
import type { TaskType } from './types';

export function analyzeStructuralComplexity(prompt: string): number {
  let score = 0;
  
  // 長いプロンプト（多くの情報を含む）
  if (prompt.length > 800) score += 2;
  else if (prompt.length > 400) score += 1;
  
  // 箇条書きや番号付きリスト（構造化された要求）
  const listPatterns = /(?:^|\n)\s*[-*•]|\d+\./gm;
  const listCount = (prompt.match(listPatterns) || []).length;
  if (listCount > 5) score += 2;
  else if (listCount > 2) score += 1;
  
  // 複数の質問（多面的な分析要求）
  const questionCount = (prompt.match(/[？?]/g) || []).length;
  if (questionCount > 4) score += 2;
  else if (questionCount > 2) score += 1;
  
  return Math.min(score, 3); // 最大3点
}

export function analyzeCognitiveDepth(prompt: string): number {
  let score = 0;
  
  // 「なぜ」「どのように」系の深い思考を要求
  if (/なぜ|why|理由|根拠|背景/i.test(prompt)) score += 1;
  if (/どのように|how|方法|手順|プロセス/i.test(prompt)) score += 1;
  
  // 比較・評価を要求
  if (/比較|compare|評価|evaluate|トレードオフ|trade-?off/i.test(prompt)) score += 2;
  
  // 設計・アーキテクチャレベルの思考
  if (/設計|design|アーキテクチャ|architecture|構造|structure/i.test(prompt)) score += 1;
  
  return Math.min(score, 3); // 最大3点
}

export function analyzeDomainBreadth(prompt: string): number {
  let score = 0;
  const domains: string[] = [];
  
  // 技術ドメイン
  if (/コード|code|実装|implement|プログラム/i.test(prompt)) domains.push('tech');
  
  // ビジネスドメイン
  if (/ビジネス|business|戦略|strategy|ROI|コスト/i.test(prompt)) domains.push('business');
  
  // セキュリティドメイン
  if (/セキュリティ|security|脆弱性|vulnerability|リスク/i.test(prompt)) domains.push('security');
  
  // パフォーマンスドメイン
  if (/パフォーマンス|performance|最適化|optimiz|スケール/i.test(prompt)) domains.push('performance');
  
  // 運用ドメイン
  if (/運用|operation|監視|monitoring|保守|maintenance/i.test(prompt)) domains.push('ops');
  
  // 複数ドメインにまたがる場合
  if (domains.length >= 3) score = 3;
  else if (domains.length === 2) score = 2;
  else if (domains.length === 1) score = 0;
  
  return score; // 最大3点
}

export async function selectAggregatorByCognitiveAnalysis(
  prompt: string,
  taskType: 'basic' | 'premium' | 'critical' | 'simple'
): Promise<string> {
  const aggregatorConfig = providersConfig.aggregatorSelection;
  
  // シンプルなクエリは軽量アグリゲーター
  if (taskType === 'simple') {
    logger.info(`🎯 Simple query detected → Using Sonnet 4.6 for fast aggregation`);
    return aggregatorConfig.defaultAggregator; // Sonnet 4.6
  }
  
  // critical → Opus 4.8 from first pass; routine complexity → Opus 4.6
  if (taskType === 'critical' || providersConfig.taskTypeMapping[taskType]) {
    const mappedAggregator = providersConfig.taskTypeMapping[taskType];
    if (mappedAggregator) {
      logger.info(`🎯 Task type mapping: ${taskType} → ${mappedAggregator}`);
      return mappedAggregator;
    }
  }

  // Claude Code自身が複雑さを認識
  // 以下の要素を総合的に判断：
  // 1. プロンプトの構造的複雑さ（階層性、依存関係）
  // 2. 求められる思考の深さ（分析レベル）
  // 3. 複数ドメインにまたがるか
  
  const structuralComplexity = analyzeStructuralComplexity(prompt);
  const cognitiveDepth = analyzeCognitiveDepth(prompt);
  const domainBreadth = analyzeDomainBreadth(prompt);
  
  const complexityScore = structuralComplexity + cognitiveDepth + domainBreadth;
  
  // High structural complexity → Opus 4.6 (escalate to 4.8 if gates fail)
  if (complexityScore >= 6) {
    logger.info(`🎯 High complexity detected (score: ${complexityScore}) → ${aggregatorConfig.complexAggregator}`, {
      structural: structuralComplexity,
      cognitive: cognitiveDepth,
      domain: domainBreadth
    });
    return aggregatorConfig.complexAggregator;
  }
  
  // デフォルトはSonnet 4
  logger.info(`🎯 Standard complexity (score: ${complexityScore}) → ${aggregatorConfig.defaultAggregator}`, {
    structural: structuralComplexity,
    cognitive: cognitiveDepth,
    domain: domainBreadth
  });
  return aggregatorConfig.defaultAggregator;
}
