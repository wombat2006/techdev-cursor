/**
 * Unified provider MCP server — stdio transport for Cursor.
 * Tools: analyze_claude, analyze_codex, analyze_agy
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { agyAdapter } from '../adapters/agy-adapter';
import { claudeAdapter } from '../adapters/claude-adapter';
import { codexAdapter } from '../adapters/codex-adapter';
import {
  resolveInferenceProfile,
} from '../adapters/inference-profile-resolver';
import type { ProviderAdapter } from '../types/adapter-types';
import type { AnalyzeToolInput } from '../types/inference-profile';
import { logger } from '../utils/logger';

const ANALYZE_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    prompt: { type: 'string', description: 'Analysis prompt or task' },
    context: { type: 'string', description: 'Optional additional context' },
    preset: {
      type: 'string',
      enum: ['fast', 'balanced', 'deep'],
      description: 'Inference preset (Track A-2: critical reserved for aggregator)',
    },
    model: { type: 'string', description: 'Model id or alias' },
    effort: { type: 'string', description: 'Provider-native effort level' },
    cot: { type: 'string', enum: ['off', 'brief', 'full'], description: 'Chain-of-thought policy' },
    temperature: { type: 'number', description: 'Sampling temperature when supported' },
    workingDirectory: { type: 'string', description: 'Working directory for CLI spawn' },
  },
  required: ['prompt'],
};

const TOOLS: Tool[] = [
  {
    name: 'analyze_claude',
    description: 'Single-shot analysis via Claude Code CLI (subscription OAuth). Uses claude --print.',
    inputSchema: ANALYZE_INPUT_SCHEMA,
  },
  {
    name: 'analyze_codex',
    description: 'Single-shot analysis via Codex CLI (subscription). Non-interactive codex exec.',
    inputSchema: ANALYZE_INPUT_SCHEMA,
  },
  {
    name: 'analyze_agy',
    description: 'Single-shot analysis via Antigravity CLI (agy --print, Google Tier 1).',
    inputSchema: ANALYZE_INPUT_SCHEMA,
  },
];

const ADAPTER_BY_TOOL: Record<string, ProviderAdapter> = {
  analyze_claude: claudeAdapter,
  analyze_codex: codexAdapter,
  analyze_agy: agyAdapter,
};

const PROVIDER_BY_TOOL: Record<string, 'claude' | 'codex' | 'agy'> = {
  analyze_claude: 'claude',
  analyze_codex: 'codex',
  analyze_agy: 'agy',
};

function parseAnalyzeInput(args: Record<string, unknown>): AnalyzeToolInput {
  return {
    prompt: String(args.prompt ?? ''),
    context: args.context ? String(args.context) : undefined,
    preset: args.preset as AnalyzeToolInput['preset'],
    model: args.model ? String(args.model) : undefined,
    effort: args.effort ? String(args.effort) : undefined,
    cot: args.cot as AnalyzeToolInput['cot'],
    temperature: typeof args.temperature === 'number' ? args.temperature : undefined,
    workingDirectory: args.workingDirectory ? String(args.workingDirectory) : undefined,
  };
}

function adapterResultToMcpContent(result: Awaited<ReturnType<ProviderAdapter['invoke']>>) {
  if (result.success && result.content !== undefined) {
    return {
      content: [{ type: 'text' as const, text: result.content }],
      isError: false,
    };
  }
  const message = result.error ?? 'Unknown adapter error';
  return {
    content: [{ type: 'text' as const, text: message.substring(0, 2000) }],
    isError: true,
  };
}

export async function startTechsapoProvidersMcpServer(): Promise<void> {
  logger.info('Starting techsapo-providers MCP server (stdio)');

  const server = new Server(
    { name: 'techsapo-providers', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const adapter = ADAPTER_BY_TOOL[toolName];
    const provider = PROVIDER_BY_TOOL[toolName];

    if (!adapter || !provider) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
    }

    const input = parseAnalyzeInput((request.params.arguments ?? {}) as Record<string, unknown>);
    if (!input.prompt.trim()) {
      return {
        content: [{ type: 'text', text: 'prompt is required' }],
        isError: true,
      };
    }

    const profile = resolveInferenceProfile(provider, input);
    logger.info('MCP analyze tool invoked', {
      tool: toolName,
      preset: input.preset,
      model: profile.model,
      promptLength: input.prompt.length,
    });

    const result = await adapter.invoke({
      prompt: input.prompt,
      context: input.context,
      profile,
      workingDirectory: input.workingDirectory,
    });

    return adapterResultToMcpContent(result);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('techsapo-providers MCP server ready');
}

if (require.main === module) {
  startTechsapoProvidersMcpServer().catch((error) => {
    logger.error('Failed to start techsapo-providers MCP server', { error });
    process.exit(1);
  });
}
