/** Codex MCP shared types (SRP module) */

export interface CodexMCPConfig {
// Codex CLI Configuration
model?: 'gpt-5' | 'gpt-5-codex' | 'o1' | 'o1-mini';
sandbox?: 'read-only' | 'isolated' | 'full-access';
base_instructions?: string;
working_directory?: string;

// MCP Integration Settings
approval_policy?: 'auto' | 'manual' | 'risk-based';
max_concurrent_sessions?: number;
session_timeout_ms?: number;

// パフォーマンス最適化設定
enable_connection_pooling?: boolean;
enable_response_caching?: boolean;
cache_ttl_ms?: number;
enable_request_batching?: boolean;
batch_size?: number;
batch_timeout_ms?: number;
enable_compression?: boolean;
enable_keep_alive?: boolean;

// Logging and Monitoring
rust_log_level?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
enable_tracing?: boolean;
log_directory?: string;
enable_performance_metrics?: boolean;

// Wall-Bounce Integration
enable_wall_bounce?: boolean;
min_providers?: number;
quality_threshold?: number;
}

export interface CodexExecutionContext {
session_id?: string;
conversation_id?: string;
user_id?: string;
mode: 'interactive' | 'non-interactive' | 'ci';
resume_session?: boolean;
full_auto?: boolean;
}

export function mergeCodexMCPConfig(config: CodexMCPConfig = {}): CodexMCPConfig {
  return {
    model: 'gpt-5-codex',
    sandbox: 'read-only',
    approval_policy: 'risk-based',
    max_concurrent_sessions: 15,
    session_timeout_ms: 600000,
    rust_log_level: 'info',
    enable_tracing: true,
    enable_wall_bounce: true,
    min_providers: 2,
    quality_threshold: 0.7,
    enable_connection_pooling: true,
    enable_response_caching: true,
    cache_ttl_ms: 300000,
    enable_request_batching: true,
    batch_size: 5,
    batch_timeout_ms: 1000,
    ...config,
  };
}
