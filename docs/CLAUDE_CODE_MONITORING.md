# Claude Code — Monitoring (OpenTelemetry)

**Status**: Documented — no OTel env block committed for Claude Code sessions in this repo  
**Platform**: [Monitoring](https://code.claude.com/docs/en/monitoring-usage) · [Data usage (Anthropic telemetry)](https://code.claude.com/docs/en/data-usage)  
**Related**: [agents/claude-code.md](./agents/claude-code.md) · [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) · [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md) · [CLAUDE_CODE_DEBUG.md](./CLAUDE_CODE_DEBUG.md) · [MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md) · [SECURITY.md](./SECURITY.md)

---

## What it is

Claude Code exports **usage, cost, and tool activity** via **OpenTelemetry (OTel)**:

| Signal | Protocol | Default |
|--------|----------|---------|
| **Metrics** | OTLP / Prometheus / console | Off until configured |
| **Events** (logs) | OTLP / console | Off until configured |
| **Traces** (beta) | OTLP / console | Off |

Export is **opt-in** (`CLAUDE_CODE_ENABLE_TELEMETRY=1`). Data goes to **your** backend only — separate from Anthropic operational telemetry ([data usage](https://code.claude.com/docs/en/data-usage)).

**Fork split:**

| Layer | Doc |
|-------|-----|
| **Claude Code client OTel** | This page |
| **TechSapo server** (Prometheus, Grafana, PM2) | [MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md) |

Wall-Bounce `claude --print` adapter does not instrument OTel today; interactive `claude` / IDE sessions do when env is set.

---

## Quick start

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# Debug: shorter intervals (reset for production)
export OTEL_METRIC_EXPORT_INTERVAL=10000   # default 60000
export OTEL_LOGS_EXPORT_INTERVAL=5000      # default 5000

claude
```

**Service identity:** `service.name=claude-code`, meter `com.anthropic.claude_code`.

**Subprocess note:** `OTEL_*` is **not** passed to Bash, hooks, MCP servers, or LSP — instrument those apps separately if needed.

---

## Administrator configuration

Fleet-wide via [managed settings](https://code.claude.com/docs/en/server-managed-settings) `env` block (high precedence, users cannot override):

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.example.com:4317"
  }
}
```

Dynamic auth headers: `otelHeadersHelper` in `.claude/settings.json` (http/protobuf and http/json only; refreshes ~29 min).

---

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_ENABLE_TELEMETRY` | Required enable flag |
| `OTEL_METRICS_EXPORTER` | `otlp`, `prometheus`, `console`, `none` (comma-separated) |
| `OTEL_LOGS_EXPORTER` | `otlp`, `console`, `none` |
| `OTEL_EXPORTER_OTLP_*` | Endpoint, protocol, per-signal overrides, headers |
| `OTEL_METRIC_EXPORT_INTERVAL` | Metrics flush ms (default 60000) |
| `OTEL_LOGS_EXPORT_INTERVAL` | Logs flush ms (default 5000) |
| `OTEL_RESOURCE_ATTRIBUTES` | Team/cost-center labels — **no spaces** in values |
| `OTEL_METRICS_INCLUDE_*` | Cardinality control (session.id, account uuid, etc.) |
| `OTEL_LOG_USER_PROMPTS` | Log prompt text (default off) |
| `OTEL_LOG_TOOL_DETAILS` | Bash commands, MCP names, skill names (default off) |
| `OTEL_LOG_TOOL_CONTENT` | Tool I/O in spans — requires traces (default off) |
| `OTEL_LOG_RAW_API_BODIES` | Full API JSON — `1` or `file:<dir>` (default off) |

Full table on platform. mTLS: `CLAUDE_CODE_CLIENT_*` (HTTP) or `OTEL_EXPORTER_OTLP_CLIENT_*` (gRPC).

---

## Metrics (summary)

| Metric | Unit | Notes |
|--------|------|-------|
| `claude_code.session.count` | count | `start_type`: fresh / resume / continue |
| `claude_code.token.usage` | tokens | By `type`: input, output, cacheRead, cacheCreation |
| `claude_code.cost.usage` | USD | Approximate — use provider billing for official |
| `claude_code.lines_of_code.count` | count | added / removed; model attr v2.1.172+ |
| `claude_code.commit.count` | count | Git commits via Claude |
| `claude_code.pull_request.count` | count | PR/MR creation |
| `claude_code.code_edit_tool.decision` | count | accept/reject on Edit/Write/NotebookEdit |
| `claude_code.active_time.total` | s | user vs cli active time |

**Standard attributes:** `session.id`, `user.email` (OAuth), `user.account_uuid`, `terminal.type` (includes `cursor`), `organization.id`, custom keys from `OTEL_RESOURCE_ATTRIBUTES`.

**Cost/token attribution:** `skill.name`, `plugin.name`, `agent.name`, `mcp_server.name`, `mcp_tool.name` (third-party names redacted unless `OTEL_LOG_TOOL_DETAILS=1`).

---

## Events (audit-oriented subset)

Requires `OTEL_LOGS_EXPORTER`. Correlate per prompt with `prompt.id` (events only — not on metrics).

| Event | Use |
|-------|-----|
| `claude_code.user_prompt` | Prompt submitted |
| `claude_code.api_request` / `api_error` / `api_refusal` | API lifecycle |
| `claude_code.tool_result` / `tool_decision` | Tool execution and permission |
| `claude_code.permission_mode_changed` | Mode escalation (incl. auto mode) |
| `claude_code.hook_execution_*` | Hook audit |
| `claude_code.mcp_server_connection` | MCP connect/fail |
| `claude_code.compaction` | Context compaction |
| `claude_code.plugin_installed` / `plugin_loaded` | Plugin inventory |

**SIEM pattern:** `OTEL_LOGS_EXPORTER=otlp` + `OTEL_LOG_TOOL_DETAILS=1` for MCP/Bash audit detail. Map signals → events in platform [audit section](https://code.claude.com/docs/en/monitoring-usage#audit-security-events).

**Retry exhaustion:** `api_error.attempt` > `CLAUDE_CODE_MAX_RETRIES` (default 10) = transient retries exhausted.

---

## Traces (beta)

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1
export OTEL_TRACES_EXPORTER=otlp
```

**Span tree:**

```
claude_code.interaction
├── claude_code.llm_request
├── claude_code.hook          (detailed beta only)
└── claude_code.tool
    ├── claude_code.tool.blocked_on_user
    └── claude_code.tool.execution
```

**Propagation:** Bash subprocesses get `TRACEPARENT` when tracing on. Anthropic API gets `traceparent` when direct API (or `CLAUDE_CODE_PROPAGATE_TRACEPARENT=1` for custom proxy). `claude -p` / Agent SDK reads inbound `TRACEPARENT` from caller.

Detailed hook spans: `ENABLE_BETA_TRACING_DETAILED=1` + `BETA_TRACING_ENDPOINT` (org allowlist for interactive CLI).

---

## Privacy and security

| Default | Detail |
|---------|--------|
| Prompt content | Redacted — enable `OTEL_LOG_USER_PROMPTS=1` |
| Tool args | Redacted — enable `OTEL_LOG_TOOL_DETAILS=1` |
| Tool I/O in spans | Redacted — enable `OTEL_LOG_TOOL_CONTENT=1` |
| Raw API bodies | Off — `OTEL_LOG_RAW_API_BODIES` implies full conversation export |

Data goes only to **your** OTLP endpoint. Configure backend redaction for `user.email` if needed. Bedrock/Vertex/API-key sessions: attach identity via `OTEL_RESOURCE_ATTRIBUTES` (`enduser.id=...`).

---

## Multi-team / cardinality

```bash
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform,cost_center=eng-123"
```

No spaces in values — use underscores or percent-encoding. High-cardinality keys inflate storage; set `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES=false` to keep custom attrs in resource block only.

---

## Backend and ROI

- **Metrics:** Prometheus, ClickHouse, Datadog, Grafana Cloud, …
- **Events/logs:** Elasticsearch, Loki, OTLP → SIEM
- **Traces:** Jaeger, Tempo, Honeycomb, …
- **ROI templates:** [claude-code-monitoring-guide](https://github.com/anthropics/claude-code-monitoring-guide)
- **Bedrock:** [AWS monitoring guide](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md)

---

## Fork mapping

| Platform | This repo |
|----------|-----------|
| `/usage` in-session | [CLAUDE_CODE_COST_MANAGEMENT.md](./CLAUDE_CODE_COST_MANAGEMENT.md) |
| Prometheus on :9090 | [MONITORING_OPERATIONS.md](./MONITORING_OPERATIONS.md) — **server**, not Claude Code OTel |
| Hook + permission audit | [CLAUDE_CODE_HOOKS.md](./CLAUDE_CODE_HOOKS.md) · [CLAUDE_CODE_AUTO_MODE.md](./CLAUDE_CODE_AUTO_MODE.md) |
| `terminal.type=cursor` | Cursor IDE sessions tagged when detected |

---

## Catalog fields (Sonnet)

| Field | Usage |
|-------|--------|
| `apiFeatures.agentSkills.claudeCode.monitoring` | Platform URL + enable env |
| `prompting.guidanceTopics[]` | `claude-code-monitoring-*` |

---

## AS-IS gaps

| Area | Gap |
|------|-----|
| Repo | No managed `env` OTel block for developers |
| Adapter | `claude-adapter.ts` — no OTel export path |
| F-10 | Monitoring topics not injected at runtime |
| Server | TechSapo Prometheus does not ingest Claude Code OTel by default |

---

## See also

- [Monitoring (platform)](https://code.claude.com/docs/en/monitoring-usage)
- [Cost management](./CLAUDE_CODE_COST_MANAGEMENT.md)
- [Admin setup](https://code.claude.com/docs/en/admin-setup)
- [Network config / mTLS](https://code.claude.com/docs/en/network-config)
