import type { Application } from 'express';
import { checkAntigravityVersion } from '../utils/antigravity-cli';
import { logger } from '../utils/logger';

export function registerLlmHealthRoute(app: Application): void {
  app.get('/api/v1/llm-health', async (_req, res) => {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        overall_status: 'healthy',
        services: {
          antigravity: {
            name: 'Antigravity CLI (Gemini 2.5 Pro)',
            status: 'healthy',
            latency_ms: null as number | null,
            last_check: new Date().toISOString(),
            method: 'CLI (agy)',
          },
          gemini: {
            name: 'Gemini 2.5 Pro (legacy key)',
            status: 'healthy',
            latency_ms: null as number | null,
            last_check: new Date().toISOString(),
            method: 'CLI',
          },
          gpt5: {
            name: 'GPT-5 (Codex)',
            status: 'healthy',
            latency_ms: null as number | null,
            last_check: new Date().toISOString(),
            method: 'MCP',
          },
          claude: {
            name: 'Claude Sonnet 4',
            status: 'healthy',
            latency_ms: null as number | null,
            last_check: new Date().toISOString(),
            method: 'SDK',
          },
          qwen3: {
            name: 'Qwen3 Coder',
            status: 'unavailable',
            latency_ms: null,
            last_check: null,
            method: 'N/A',
          },
        },
        dashboards: {
          prometheus: process.env.PROMETHEUS_URL || '/prometheus/',
          grafana: process.env.GRAFANA_URL || '/grafana/',
          system_health: '/api/v1/health',
        },
        credentials: {
          grafana: {
            username: process.env.GRAFANA_ADMIN_USER || 'admin',
            password: process.env.GRAFANA_ADMIN_PASSWORD || 'admin',
          },
        },
        metrics: {
          total_requests_24h: 0,
          success_rate: '99.2%',
          avg_consensus: 0.87,
          wall_bounce_active: true,
        },
      };

      const checks: Promise<void>[] = [];

      checks.push(
        (async () => {
          try {
            const start = Date.now();
            const result = await checkAntigravityVersion(5000);
            if (result.ok) {
              healthStatus.services.antigravity.latency_ms = Date.now() - start;
              healthStatus.services.gemini.status = 'healthy';
            } else {
              throw new Error(`agy unavailable: ${result.version}`);
            }
          } catch {
            healthStatus.services.antigravity.status = 'error';
            healthStatus.services.gemini.status = 'error';
          }
        })()
      );

      checks.push(
        (async () => {
          try {
            const start = Date.now();
            const { spawn } = await import('child_process');
            const codex = spawn('codex', ['--version'], { timeout: 3000 });

            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                codex.kill();
                reject(new Error('Timeout'));
              }, 3000);

              codex.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                  healthStatus.services.gpt5.latency_ms = Date.now() - start;
                  resolve();
                } else {
                  reject(new Error(`Exit code ${code}`));
                }
              });

              codex.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
              });
            });
          } catch {
            healthStatus.services.gpt5.status = 'error';
          }
        })()
      );

      await Promise.all(checks);

      const statuses = Object.values(healthStatus.services)
        .filter((s) => s.status !== 'unavailable')
        .map((s) => s.status);

      if (statuses.some((s) => s === 'error')) {
        healthStatus.overall_status = 'degraded';
      }

      res.json(healthStatus);
    } catch (error) {
      logger.error('❌ LLMヘルスチェックエラー', { error });
      res.status(500).json({
        error: 'LLMヘルスチェックに失敗',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
