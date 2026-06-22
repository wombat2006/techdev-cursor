import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger';

interface ProviderConfig {
  key: string;
  name: string;
  model: string;
  modelArgs?: Record<string, unknown>;
  tier: number;
  capabilities: string[];
  invocationType: 'agy' | 'gemini' | 'gpt5' | 'claude';
  role?: 'default-aggregator' | 'complex-aggregator';
}

export interface LLMProvidersConfig {
  providers: ProviderConfig[];
  aggregatorSelection: {
    defaultAggregator: string;
    complexAggregator: string;
    complexityThreshold: number;
    complexityIndicators: {
      keywords: string[];
      japaneseKeywords: string[];
      promptLengthThreshold: number;
      questionMarkThreshold: number;
    };
  };
  taskTypeMapping: Record<string, string>;
}

let providersConfig: LLMProvidersConfig;
try {
  const configPath = path.join(__dirname, '../../config/llm-providers.json');
  providersConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (error) {
  logger.error('Failed to load LLM providers config', { error });
  throw new Error('LLM providers configuration is required');
}

export { providersConfig };

export const DEFAULT_AGGREGATOR_PROVIDER = providersConfig.aggregatorSelection.defaultAggregator;
export const COMPLEX_AGGREGATOR_PROVIDER = providersConfig.aggregatorSelection.complexAggregator;

export const PROVIDER_GUIDANCE: Record<string, { parallel?: string[]; sequential?: string }> = {
  'gemini-2.5-pro': {
    parallel: [
      '最新の公開情報や業界トレンドを踏まえ、全体の背景・課題・影響を整理してください。',
      '日本語で、箇条書きと短い補足説明を組み合わせてください。'
    ],
    sequential: 'これまでに得られた洞察を補足し、背景情報や潜在的リスクを整理してください。'
  },
  'gpt-5-codex': {
    parallel: [
      '要求仕様: 実装手順を1-5ステップで明確に示し、各ステップに具体的なコード例を含めてください。',
      '制約: 特定されたリスクは重要度順（高/中/低）で分類し、各改善案は実装難易度を付記してください。'
    ],
    sequential: '制約: 既出分析との矛盾を避け、新規実装要素のみ詳述してください。未解決の技術課題があれば具体的な調査方針を提示してください。'
  },
  'gpt-5': {
    parallel: [
      '要求仕様: 設計選択肢を最大3つまでに絞り、各選択肢のコスト・パフォーマンス・メンテナンス性を数値またはランク評価してください。',
      '制約: 結論は明確な推奨事項（採用/非採用）と根拠を3つまでで示してください。'
    ],
    sequential: '制約: 既出分析の設計決定と整合性を保ち、新たな意思決定要素のみ提示してください。長期影響は定量的リスク評価を含めてください。'
  },
  'sonnet-4': {
    parallel: [
      '人的・運用的な観点からの影響やリスク、関係者コミュニケーションのポイントをまとめてください。',
      '簡潔なストーリーを添えてください。'
    ],
    sequential: '既出の分析を踏まえ、運用手順やコミュニケーション観点での推奨事項を補足してください。'
  }
};

export const AGGREGATOR_INSTRUCTIONS = [
  '以下の各LLM回答を統合し、矛盾があれば整合させてください。',
  '重複内容は統合し、最終的な推奨行動・留意点・フォローアップを明確にしてください。',
  'アウトプットは日本語で、要約→推奨→リスク/フォローアップの順で構成してください。'
];

export const META_PROMPT_TEMPLATE = `
あなたは壁打ち分析システムのプロンプト最適化アドバイザーです。
以下のプロンプトを分析し、改善案を提示してください：

現在のプロンプト: {current_prompt}
対象プロバイダー: {provider_name}
分析タスク: {task_type}

最適化観点:
1. 曖昧性の除去: 解釈が分かれる表現を特定し修正案を提示
2. 制約の明確化: 具体的な出力要件と制限を定義
3. 効率性向上: 不要な説明を削除し、核心的指示に集約
4. 整合性確保: 他プロバイダーとの役割分担を明確化

改善案を以下の形式で出力してください：
- 問題点: [具体的な問題]
- 修正案: [改善されたプロンプト]
- 期待効果: [改善による効果]
`;
