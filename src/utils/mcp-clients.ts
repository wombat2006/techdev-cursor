/**
 * Legacy MCP client helpers — SIMULATED responses only.
 * @deprecated Track B-1 — replace rag-endpoint / log-analyzer paths with src/adapters/*
 */

import {
  assertSimulatedProvidersAllowed,
  isSimulatedProvidersAllowed,
  SIMULATED_PROVIDER_LOG_TAG,
} from './simulated-provider-guard';
import { logger } from './logger';

function logSimulatedCall(provider: string): void {
  logger.warn(`${SIMULATED_PROVIDER_LOG_TAG} ${provider} — not a real LLM invocation`);
}

/**
 * @deprecated Simulated — not GPT-5 / Codex. Use codexAdapter via unified MCP.
 */
export async function mcp__gpt_5__deep_analysis(params: { input: string }) {
  assertSimulatedProvidersAllowed('mcp__gpt_5__deep_analysis');
  logSimulatedCall('mcp__gpt_5__deep_analysis');

  try {
    const input = params.input.toLowerCase();

    let rootCause = 'Advanced technical root cause analysis completed';
    let mechanism = 'Multi-layer system failure mechanism identified';
    let resolution = ['Technical resolution steps provided by GPT-5'];
    const prevention = ['Advanced prevention strategies identified'];

    if (input.includes('nvme') && input.includes('wear')) {
      rootCause = 'NVMe SSD wear leveling failure with filesystem corruption';
      mechanism = 'Hardware media exhaustion causing XFS superblock corruption';
      resolution = [
        'Immediately backup data with xfs_repair -L',
        'Replace failing NVMe SSD',
        'Restore data to new filesystem with proper UUID',
      ];
    } else if (input.includes('port') && input.includes('binding')) {
      rootCause = 'Service port binding conflict with multiple processes';
      mechanism = 'Multiple services attempting to bind to same network port';
      resolution = [
        'Identify conflicting processes with lsof -i',
        'Stop conflicting services',
        'Restart target service',
      ];
    }

    return {
      rootCause,
      mechanism,
      resolution,
      prevention,
      confidence: 0.95,
      simulated: true as const,
    };
  } catch (error) {
    throw new Error(`GPT-5 MCP client failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * @deprecated Simulated — not Gemini / agy. Use agyAdapter via unified MCP.
 */
export async function mcp__gemini_cli__ask_gemini(params: { prompt: string; changeMode?: boolean }) {
  assertSimulatedProvidersAllowed('mcp__gemini_cli__ask_gemini');
  logSimulatedCall('mcp__gemini_cli__ask_gemini');

  try {
    const prompt = params.prompt.toLowerCase();

    let environmentFactors = ['Environment-specific factors identified'];
    let configurationIssues = ['Configuration conflicts analyzed'];
    let adjustedResolution = ['Environment-optimized resolution provided'];

    if (prompt.includes('systemd') || prompt.includes('service')) {
      environmentFactors = ['systemd service management', 'init system dependencies'];
      configurationIssues = ['Service unit configuration', 'Dependency ordering'];
      adjustedResolution = [
        'Verify systemd service configuration',
        'Check service dependencies',
        'Restart with proper ordering',
      ];
    } else if (prompt.includes('network') || prompt.includes('connection')) {
      environmentFactors = ['Network stack configuration', 'Firewall rules'];
      configurationIssues = ['Port conflicts', 'Network interface status'];
      adjustedResolution = [
        'Check network interface status',
        'Verify firewall configuration',
        'Test network connectivity',
      ];
    }

    return {
      environmentFactors,
      configurationIssues,
      adjustedResolution,
      confidence: 0.9,
      simulated: true as const,
    };
  } catch (error) {
    throw new Error(`Gemini MCP client failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy availability probe — simulate success does NOT mean Wall-Bounce is production-ready.
 */
export async function testMCPAvailability() {
  if (!isSimulatedProvidersAllowed()) {
    return {
      gpt5: false,
      gemini: false,
      wallBounceReady: false,
      simulated: false,
      error: 'Simulated MCP clients disabled outside test / TECHSAPO_ALLOW_SIMULATED_PROVIDERS=1',
    };
  }

  try {
    const gpt5Result = await mcp__gpt_5__deep_analysis({ input: 'test' });
    const geminiResult = await mcp__gemini_cli__ask_gemini({ prompt: 'test' });

    return {
      gpt5: !!gpt5Result,
      gemini: !!geminiResult,
      /** Never true for simulate — real readiness requires unified adapters + Wall-Bounce B-1 */
      wallBounceReady: false,
      simulated: true,
    };
  } catch (error) {
    return {
      gpt5: false,
      gemini: false,
      wallBounceReady: false,
      simulated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
