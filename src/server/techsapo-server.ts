import express from 'express';
import type { Server } from 'http';
import { validateEnvironment, config } from '../config/environment';
import { initializeMetrics, register as prometheusRegister } from '../metrics/prometheus-client';
import { logger } from '../utils/logger';
import { createGracefulShutdown, registerErrorHandling } from './lifecycle';
import { registerLlmHealthRoute } from './llm-health';
import { applyCoreMiddleware } from './middleware';
import { registerAppRoutes } from './routes';

export class TechSapoServer {
  private readonly app: express.Application;
  private server: Server | null = null;
  private readonly shutdown: () => void;

  constructor() {
    this.app = express();
    initializeMetrics();
    this.shutdown = createGracefulShutdown(() => this.server);

    applyCoreMiddleware(this.app);
    registerLlmHealthRoute(this.app);
    registerAppRoutes(this.app, prometheusRegister);
    registerErrorHandling(this.app, this.shutdown);
  }

  public async start(): Promise<void> {
    try {
      validateEnvironment();

      logger.info('Starting TechSapo Hugging Face Integration server...');

      this.server = this.app.listen(config.server.port, () => {
        logger.info('Server started successfully', {
          port: config.server.port,
          environment: config.server.nodeEnv,
          version: '1.0.0',
        });

        console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  🚀 TechSapo Hugging Face Integration API Server Started         ║
║                                                                  ║
║  🌐 Local URL:    http://localhost:${config.server.port}                         ║
║  📚 API Docs:     http://localhost:${config.server.port}/api/docs                ║
║  💖 Health Check: http://localhost:${config.server.port}/health                  ║
║                                                                  ║
║  🎯 Features:                                                    ║
║  • Japanese Embedding Models (5 models)                         ║
║  • Multi-Model Analysis & Comparison                            ║
║  • Text Generation & Inference                                  ║
║  • Conversation Management                                       ║
║  • Cost Tracking & Budget Monitoring                            ║
║  • Enterprise-Grade Error Handling                              ║
║                                                                  ║
║  Environment: ${config.server.nodeEnv.toUpperCase().padEnd(10)}                                      ║
║  Version: 1.0.0                                                 ║
╚══════════════════════════════════════════════════════════════════╝
        `);
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.server.port} is already in use`);
          process.exit(1);
        } else {
          logger.error('Server error', error);
          process.exit(1);
        }
      });
    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}
