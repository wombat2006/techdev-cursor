import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logFeatureFlags } from '../config/feature-flags';
import { metricsErrorHandler, metricsMiddleware } from '../middleware/metrics-middleware';
import { initializeMetrics } from '../metrics/prometheus-client';
import { logger } from '../utils/logger';
import { registerDebugRoutes } from './routes/debug-routes';
import { registerGenerateRoutes } from './routes/generate-routes';
import { registerHealthRoutes } from './routes/health-routes';
import { registerLogAnalysisRoutes } from './routes/log-analysis-routes';
import { registerRagRoutes } from './routes/rag-routes';

export function createWallBounceApp(): Express {
  initializeMetrics();
  logFeatureFlags(logger);

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(metricsMiddleware);

  app.use((req, res, next) => {
    logger.info('📥 API Request', {
      method: req.method,
      path: req.path,
      wallBounce: !!req.headers['x-wall-bounce'],
      userAgent: req.headers['user-agent'],
    });
    next();
  });

  registerHealthRoutes(app);
  registerGenerateRoutes(app);
  registerDebugRoutes(app);
  registerLogAnalysisRoutes(app);
  registerRagRoutes(app);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: `Route ${req.path} not found`,
        code: 'ROUTE_NOT_FOUND',
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  });

  app.use(metricsErrorHandler);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('🚨 Server error', { error });

    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Invalid JSON',
        code: 'INVALID_JSON',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
