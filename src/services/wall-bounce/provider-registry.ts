import { logger } from '../../utils/logger';
import type { LLMProvider } from './types';

export interface ProviderBindings {
  invokeGemini: LLMProvider['invoke'];
  invokeGeminiFlash: LLMProvider['invoke'];
  invokeGPT5: LLMProvider['invoke'];
  invokeClaude: LLMProvider['invoke'];
}

export function registerWallBounceProviders(
  providers: Map<string, LLMProvider>,
  providerOrder: string[],
  bindings: ProviderBindings,
): void {

  // 高品質LLMプロバイダーのみに限定
  // "Gemini-2.5-pro", "GPT-5-codex", "GPT-5", "Sonnet4", "Opus4.8"

  // Tier 1a: Gemini 2.5 Pro (CLI必須 - 技術的クエリ用)
  providers.set('gemini-2.5-pro', {
    name: 'Gemini-2.5-pro',
    model: 'gemini-2.5-pro',
    invoke: bindings.invokeGemini // CLI経由のみ
  });
  providerOrder.push('gemini-2.5-pro');

  // Tier 1b: Gemini 2.5 Flash (CLI必須 - シンプルクエリ用軽量モデル)
  providers.set('gemini-2.5-flash', {
    name: 'Gemini-2.5-flash',
    model: 'gemini-2.5-flash',
    invoke: bindings.invokeGeminiFlash // CLI経由のみ
  });
  providerOrder.push('gemini-2.5-flash');

  // Tier 2: GPT-5 Codex via CLI (コーディング特化 - CLI必須)
  providers.set('gpt-5-codex', {
    name: 'GPT-5-codex',
    model: 'gpt-5-codex',
    invoke: bindings.invokeGPT5 // CLI経由のみ
  });
  providerOrder.push('gpt-5-codex');

  // Tier 2b: GPT-5 General via CLI (汎用タスク - CLI必須)
  providers.set('gpt-5', {
    name: 'GPT-5',
    model: 'gpt-5',
    invoke: bindings.invokeGPT5 // CLI経由のみ
  });
  providerOrder.push('gpt-5');

  // Tier 3: Anthropic Sonnet 4 (内部呼び出しのみ)
  providers.set('sonnet-4', {
    name: 'Sonnet4',
    model: 'claude-sonnet-4',
    invoke: bindings.invokeClaude // 内部呼び出しのみ、API禁止
  });
  providerOrder.push('sonnet-4');

  // Tier 3.5: Anthropic Sonnet 4.6 (内部呼び出しのみ - Default Aggregator)
  providers.set('sonnet-4.6', {
    name: 'Sonnet4.6',
    model: 'claude-sonnet-4-6',
    invoke: bindings.invokeClaude // 内部呼び出しのみ、API禁止
  });
  providerOrder.push('sonnet-4.6');

  // Tier 4: Anthropic Opus 4.6 (default aggregate) + 4.8 (escalation)
  providers.set('opus-4.6', {
    name: 'Opus4.6',
    model: 'claude-opus-4-6',
    invoke: bindings.invokeClaude
  });
  providerOrder.push('opus-4.6');

  providers.set('opus-4.8', {
    name: 'Opus4.8',
    model: 'claude-opus-4-8',
    invoke: bindings.invokeClaude // 内部呼び出しのみ、API禁止
  });
  providerOrder.push('opus-4.8');

  logger.info('🚀 Wall-Bounce Providers初期化完了（高品質モデルのみ）', {
    total_providers: providers.size,
    gemini_pro_providers: 1, // Gemini-2.5-pro only
    gpt5_providers: 2, // GPT-5-codex + GPT-5
    anthropic_providers: 2, // Sonnet4 + Opus4.8
    excluded_models: ['gemini-2.5-flash', 'lower-tier-models'],
    enforced_restrictions: {
      openai_gemini: 'CLI_ONLY',
      anthropic: 'INTERNAL_ONLY',
      quality_tier: 'HIGH_ONLY'
    }
  });
}