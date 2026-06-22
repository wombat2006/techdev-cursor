import type { Application } from 'express';
import express from 'express';
import path from 'path';
import type { Registry } from 'prom-client';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import huggingfaceRoutes from '../routes/huggingface-routes';
import ragRoutes from '../routes/rag-endpoint';
import testUIRoutes from '../routes/test-ui';
import wallBounceRoutes from '../routes/wall-bounce-api';
import webhookRoutes from '../routes/webhook-endpoints';
import webhookSetupRoutes from '../routes/webhook-setup';
import { fetchInternalHealthStatus } from './internal-health';

const PUBLIC_ALLOWED_FILES = [
  'dashboard-init.js',
  'gemini-chat.js',
  'thinking-toggle.js',
  'thinking-toggle.css',
  'hero-layout.css',
  'navbar.css',
  'styles.css',
  'app.js',
  'script.js',
  'test-inquiry.html',
  'test-wall-bounce.html',
  'debug-form.html',
  'test-minimal.html',
];

export function registerStaticRoutes(app: Application): void {
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  app.use('/public', express.static(path.join(__dirname, '../../public')));

  PUBLIC_ALLOWED_FILES.forEach((filename) => {
    app.get(`/${filename}`, (req, res, next) => {
      if (filename.endsWith('.js') || filename.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      const filePath = path.join(__dirname, '../../public', filename);
      res.sendFile(filePath, (err) => {
        if (err) {
          logger.error(`Failed to serve ${filename}`, { error: err });
          next(err);
        }
      });
    });
  });
}

export function registerAppRoutes(app: Application, prometheusRegister: Registry): void {
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', prometheusRegister.contentType);
      const metrics = await prometheusRegister.metrics();
      res.end(metrics);
    } catch (error) {
      logger.error('Failed to generate metrics', { error });
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  registerStaticRoutes(app);

  app.use('/api/v1/wall-bounce', wallBounceRoutes);
  app.use('/api/v1/huggingface', huggingfaceRoutes);
  app.use('/api/huggingface', huggingfaceRoutes);
  app.use('/test-ui', testUIRoutes);
  app.use('/api/v1/rag', ragRoutes);
  app.use('/api/v1/webhooks', webhookRoutes);
  app.use('/api/v1/webhook-setup', webhookSetupRoutes);

  app.get('/api/docs', (_req, res) => {
    res.json({
      service: 'TechSapo Hugging Face Integration API',
      version: '1.0.0',
      description: 'Multi-Tier LLM Orchestrator with Japanese embedding models integration',
      endpoints: {
        health: 'GET /health - Health check',
        info: 'GET /info - System information',
        models: 'GET /models - Available models',
        embeddings: {
          generate: 'POST /embeddings - Generate embeddings',
          analyze: 'POST /embeddings/analyze - Multi-model analysis',
          recommend: 'POST /embeddings/recommend - Get model recommendation',
        },
        inference: {
          generate: 'POST /generate - Generate text inference',
          continue: 'POST /conversation/continue - Continue conversation',
          history: 'GET /conversation/{id} - Get conversation history',
        },
        cost: {
          summary: 'GET /cost/summary - Cost summary',
          alerts: 'GET /cost/alerts - Budget alerts',
          daily: 'GET /cost/report/daily - Daily report',
          predict: 'POST /cost/predict - Predict cost',
        },
      },
      documentation: 'https://github.com/your-repo/techsapo-huggingface-integration',
      contact: 'support@techsapo.com',
    });
  });

  app.get('/api/status', async (_req, res) => {
    try {
      const healthStatus = await fetchInternalHealthStatus();

      res.json({
        message: 'TechSapo Hugging Face Integration API',
        version: '1.0.0',
        status: healthStatus.status,
        services: healthStatus.services,
        docs: '/api/docs',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv,
      });
    } catch (error) {
      logger.error('Failed to get health status for root endpoint', error);
      res.json({
        message: 'TechSapo Hugging Face Integration API',
        version: '1.0.0',
        status: 'error',
        docs: '/api/docs',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv,
      });
    }
  });
}
