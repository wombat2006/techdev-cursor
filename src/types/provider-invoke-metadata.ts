/**
 * TS-26 — Normalized metadata from subscription CLI invocations (adapter boundary).
 * Wire formats: config/schemas/cli-metadata/*.schema.json
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  reasoningOutputTokens?: number;
}

/** Orchestrator-facing metadata after adapter parse + map. */
export interface ProviderInvokeMetadata {
  resolvedModel: string;
  stopReason?: string;
  usage?: TokenUsage;
  costUsd?: number;
  sessionId?: string;
  durationMs?: number;
  numTurns?: number;
  terminalReason?: string;
  /** Redacted provider-native payload for Layer A audit only. */
  providerRaw?: unknown;
  /** True when usage/model were estimated (e.g. agy text-only fallback). */
  provisional?: boolean;
}

/** Claude CLI: `claude --print --output-format json` (single object). */
export interface ClaudeCliResultWire {
  type: 'result';
  result: string;
  stop_reason?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  modelUsage?: Record<
    string,
    {
      inputTokens?: number;
      outputTokens?: number;
      cacheReadInputTokens?: number;
      cacheCreationInputTokens?: number;
    }
  >;
  total_cost_usd?: number;
  session_id?: string;
  duration_ms?: number;
  num_turns?: number;
  terminal_reason?: string;
}

/** Codex CLI: one JSONL line from `codex exec --json`. */
export type CodexCliEventWire =
  | { type: 'thread.started'; thread_id: string }
  | { type: 'turn.started' }
  | {
      type: 'turn.completed';
      usage: {
        input_tokens: number;
        cached_input_tokens?: number;
        output_tokens: number;
        reasoning_output_tokens?: number;
      };
    }
  | { type: 'turn.failed'; error?: { message?: string } }
  | {
      type: 'item.completed';
      item: {
        id?: string;
        type: string;
        text?: string;
        message?: string;
      };
    }
  | { type: 'error'; message?: string };

/** agy: text stdout only until structured output is confirmed (provisional). */
export interface AgyCliTextWire {
  content: string;
  stderr?: string;
}
