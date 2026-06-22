import { logger } from '../../utils/logger';
import type { ExecuteOptions, LLMProvider, LLMResponse, TaskType, WallBounceFlowDetails, WallBounceResult } from './types';
import type { WallBounceModeContext } from './mode-context';

export async function executeSequentialMode(
  ctx: WallBounceModeContext,
  
  prompt: string,
  providers: Array<{ name: string; handler: LLMProvider }>,
  aggregator: LLMProvider,
  aggregatorKey: string,
  minProviders: number,
  startTime: number,
  depth: number,
  flowDetails: WallBounceFlowDetails,
  options: ExecuteOptions = {},
  taskType: 'basic' | 'premium' | 'critical' | 'simple' = 'basic'
): Promise<WallBounceResult> {
  const providerResponses: Array<LLMResponse & { provider: string }> = [];
  const providerErrors: string[] = [];
  let accumulatedSummary = '';

  // Streaming thinking callback helper
  const emitThinking = (provider: string, step: string, content: string) => {
    if (options.onThinking) {
      options.onThinking(provider, step, content);
    }
  };

  const emitProviderResponse = (provider: string, response: string) => {
    if (options.onProviderResponse) {
      options.onProviderResponse(provider, response);
    }
  };

  // Thinking: Sequential mode initialization
  emitThinking(
    'Claude Code (Orchestrator)',
    'Sequential Chain Setup',
    `Initializing sequential wall-bounce chain with depth ${depth}. Each provider will build upon previous responses.`
  );

  // depth制御: 指定された深度分だけwall-bounceを実行
  const selectedProviders = ctx.selectProvidersForDepth(providers, depth);

  logger.info('🔄 Sequential Wall-Bounce実行', {
    totalProviders: providers.length,
    selectedForDepth: selectedProviders.length,
    depth,
    providerNames: selectedProviders.map(p => p.name)
  });

  console.log(`🔄 シリアルモード実行開始 - Depth: ${depth}`);
  console.log(`📋 選択プロバイダー: ${selectedProviders.map(p => p.name).join(' → ')}\n`);

  for (let i = 0; i < selectedProviders.length; i++) {
    const { name, handler } = selectedProviders[i];
    const currentDepth = i + 1;
    const stepStartTime = Date.now();

    try {
      // Thinking: Sequential step preparation
      emitThinking(
        'Claude Code (Orchestrator)',
        `Step ${currentDepth}/${depth}: Preparing ${name}`,
        `Building context-aware prompt for ${name}. ${currentDepth > 1 ? `Incorporating insights from ${currentDepth - 1} previous provider(s).` : 'First provider in sequential chain.'}`
      );

      const providerPrompt = ctx.buildProviderPrompt(prompt, name, 'sequential', providerResponses, accumulatedSummary, currentDepth, depth, taskType);

      // LLMへの送信ログ
      console.log(`
┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ 📤 STEP ${currentDepth}/${depth}: ${name.toUpperCase()} へのリクエスト`);
      console.log(`└─────────────────────────────────────────────────────────────┘`);
      console.log(`🕐 時刻: ${new Date().toISOString()}`);
      console.log(`📝 送信プロンプト:
${ctx.truncateForDisplay(providerPrompt, 500)}`);
      console.log(`📊 これまでの蓄積コンテキスト:
${ctx.truncateForDisplay(accumulatedSummary, 300)}`);
      console.log(`⏳ 処理中...`);

      // Thinking: Provider invocation
      emitThinking(
        name,
        `Sequential Analysis (Step ${currentDepth}/${depth})`,
        `${name} processing query with accumulated context from previous steps. Building upon prior insights.`
      );

      const response = await ctx.invokeProvider(handler, providerPrompt, name);
      const stepProcessingTime = Date.now() - stepStartTime;

      providerResponses.push({ ...response, provider: name });
      accumulatedSummary = ctx.updateSequentialSummary(accumulatedSummary, name, response.content, currentDepth);

      // Thinking: Response received
      emitThinking(
        'Claude Code (Orchestrator)',
        `Step ${currentDepth}/${depth}: ${name} Complete`,
        `Received response from ${name}. Processing time: ${stepProcessingTime}ms. Confidence: ${(response.confidence * 100).toFixed(0)}%. Updating accumulated context for next provider.`
      );

      // Emit provider response
      emitProviderResponse(name, response.content);

      // LLMからの応答ログ
      console.log(`
┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ ✅ STEP ${currentDepth}/${depth}: ${name.toUpperCase()} からの応答`);
      console.log(`└─────────────────────────────────────────────────────────────┘`);
      console.log(`🕐 完了時刻: ${new Date().toISOString()}`);
      console.log(`⏱️  処理時間: ${stepProcessingTime}ms`);
      console.log(`🎯 信頼度: ${response.confidence.toFixed(3)}`);
      console.log(`📤 応答内容:
${ctx.truncateForDisplay(response.content, 600)}`);
      console.log(`💰 コスト: $${response.cost.toFixed(6)}`);

      // フロー詳細に記録
      flowDetails.llm_interactions.push({
        step: currentDepth,
        provider: name,
        input_prompt: providerPrompt,
        output_response: response.content,
        confidence: response.confidence,
        processing_time_ms: stepProcessingTime,
        timestamp: new Date().toISOString(),
        accumulated_context: accumulatedSummary
      });

      logger.info(`✅ Wall-Bounce depth ${currentDepth}/${depth} 完了`, {
        provider: name,
        confidence: response.confidence,
        processingTime: stepProcessingTime
      });
    } catch (error) {
      const message = `${name}: ${error instanceof Error ? error.message : String(error)}`;
      providerErrors.push(message);

      // Thinking: Provider error
      emitThinking(
        'Claude Code (Orchestrator)',
        `Step ${currentDepth}/${depth}: ${name} Error`,
        `Provider ${name} encountered an error: ${error instanceof Error ? error.message : String(error)}. Sequential chain will continue with remaining providers.`
      );

      console.log(`
┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ ❌ STEP ${currentDepth}/${depth}: ${name.toUpperCase()} エラー`);
      console.log(`└─────────────────────────────────────────────────────────────┘`);
      console.log(`🕐 エラー時刻: ${new Date().toISOString()}`);
      console.log(`💥 エラー内容: ${message}`);

      logger.error(`❌ Wall-Bounce depth ${currentDepth}/${depth} 失敗`, { provider: name, error: message });
    }
  }

  if (providerResponses.length < Math.min(minProviders, depth)) {
    const detail = providerErrors.length ? providerErrors.join('; ') : 'no provider responses';
    throw new Error(`Wall-bounce failed: Need at least ${Math.min(minProviders, depth)} providers for depth ${depth}, got ${providerResponses.length}. ${detail}`);
  }

  // Thinking: Aggregation preparation
  emitThinking(
    'Claude Code (Orchestrator)',
    'Sequential Chain Complete',
    `Sequential chain completed with ${providerResponses.length} successful providers. Preparing for final aggregation and consensus synthesis.`
  );

  console.log(`
┌─────────────────────────────────────────────────────────────┐`);
  console.log(`│ 🔗 AGGREGATION: ${aggregatorKey.toUpperCase()} 統合処理`);
  console.log(`└─────────────────────────────────────────────────────────────┘`);
  console.log(`🕐 開始時刻: ${new Date().toISOString()}`);
  console.log(`📊 統合対象: ${providerResponses.length}個のLLM応答`);

  const aggregatorPrompt = ctx.buildAggregatorPrompt(prompt, providerResponses, taskType, depth);
  console.log(`📝 Aggregator送信プロンプト:
${ctx.truncateForDisplay(aggregatorPrompt, 800)}`);

  // 各LLM応答の要約をログ出力
  providerResponses.forEach((resp, index) => {
    console.log(`
📋 応答 ${index + 1}: ${resp.provider}`);
    console.log(`   信頼度: ${resp.confidence.toFixed(3)}`);
    console.log(`   内容: ${ctx.truncateForDisplay(resp.content, 200)}`);

    flowDetails.aggregation.input_responses.push({
      provider: resp.provider,
      content: resp.content,
      confidence: resp.confidence
    });
  });

  // Thinking: Aggregator execution
  emitThinking(
    aggregatorKey,
    'Final Synthesis',
    `Aggregator analyzing ${providerResponses.length} sequential responses. Identifying patterns, resolving conflicts, and synthesizing coherent final answer.`
  );

  console.log(`⏳ ${aggregatorKey}で統合処理中...`);
  const aggregatorStartTime = Date.now();
  const {
    response: aggregatorResponse,
    aggregatorKey: finalAggregatorKey,
    tierEscalated,
  } = await ctx.runAggregateWithEscalation(
    aggregator,
    aggregatorKey,
    aggregatorPrompt,
    providerResponses,
    taskType,
    options
  );
  const aggregatorProcessingTime = Date.now() - aggregatorStartTime;
  const processingTimeMs = Date.now() - startTime;

  // Thinking: Aggregation complete
  emitThinking(
    'Claude Code (Orchestrator)',
    'Sequential Analysis Complete',
    `Aggregation completed in ${aggregatorProcessingTime}ms. Total processing time: ${processingTimeMs}ms. Final confidence: ${(aggregatorResponse.confidence * 100).toFixed(0)}%.`
  );

  // Emit provider response for aggregator
  emitProviderResponse(finalAggregatorKey, aggregatorResponse.content);

  // Emit final consensus update
  if (options.onConsensusUpdate) {
    options.onConsensusUpdate(aggregatorResponse.confidence);
  }

  console.log(`
┌─────────────────────────────────────────────────────────────┐`);
  console.log(`│ ✅ FINAL RESULT: 統合完了`);
  console.log(`└─────────────────────────────────────────────────────────────┘`);
  console.log(`🕐 完了時刻: ${new Date().toISOString()}`);
  console.log(`⏱️  Aggregator処理時間: ${aggregatorProcessingTime}ms`);
  console.log(`⏱️  全体処理時間: ${processingTimeMs}ms`);
  console.log(`🎯 最終信頼度: ${aggregatorResponse.confidence.toFixed(3)}`);
  console.log(`💰 総コスト: $${(providerResponses.reduce((sum, r) => sum + r.cost, 0) + aggregatorResponse.cost).toFixed(6)}`);
  console.log(`📤 最終統合結果:\n${ctx.truncateForDisplay(aggregatorResponse.content, 1000)}`);
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log('🎉 WALL-BOUNCE ANALYSIS COMPLETE 🎉');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Aggregation詳細を記録
  flowDetails.aggregation.aggregator_prompt = aggregatorPrompt;
  flowDetails.aggregation.final_response = aggregatorResponse.content;
  flowDetails.aggregation.timestamp = new Date().toISOString();

  return ctx.buildWallBounceResult(
    providerResponses,
    aggregatorResponse,
    finalAggregatorKey,
    providerErrors,
    processingTimeMs,
    depth,
    flowDetails,
    tierEscalated
  );
}
