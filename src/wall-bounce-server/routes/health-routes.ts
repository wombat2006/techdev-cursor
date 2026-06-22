import type { Express } from 'express';
import { register } from '../../metrics/prometheus-client';
import { logger } from '../../utils/logger';

export function registerHealthRoutes(app: Express): void {
  app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('❌ Prometheus metrics endpoint error', { error });
    res.status(500).end();
  }
});

  app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    wall_bounce_enabled: true,
    prometheus_metrics: true,
    version: '2.0.0'
  });
});

  app.get('/api/v1/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      services: {
        wall_bounce_analyzer: 'ok',
        llm_providers: ['gemini-2.5-pro', 'gpt-5', 'claude-sonnet4', 'openrouter-ensemble'],
        redis_cache: 'ok'
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});
}
