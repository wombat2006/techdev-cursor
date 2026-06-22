import type { Express } from 'express';
import type { Server } from 'http';
import { logger } from '../utils/logger';
import { createWallBounceApp } from './create-app';

const PORT = process.env.CANARY_PORT || process.env.PORT || 4000;

export const app: Express = createWallBounceApp();

export const server: Server = app.listen(PORT, () => {
  logger.info('🚀 IT Infrastructure Support Tool with Wall-Bounce Analysis', {
    service: 'techsapo-wall-bounce',
    port: PORT,
    wall_bounce_enabled: true,
    supported_llms: ['gemini-2.5-pro', 'gpt-5', 'claude-sonnet4', 'openrouter-ensemble'],
    environment: process.env.NODE_ENV || 'development',
  });
});

process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('✅ Server closed');
    process.exit(0);
  });
});
