import type { Application } from 'express';
import type { Server } from 'http';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';

export function registerProcessHandlers(shutdown: () => void): void {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason,
      promise: promise.toString(),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
    shutdown();
  });
}

export function registerErrorHandling(app: Application, shutdown: () => void): void {
  app.use(notFoundHandler);
  app.use(errorHandler);
  registerProcessHandlers(shutdown);
}

export function createGracefulShutdown(getServer: () => Server | null): () => void {
  return () => {
    logger.info('Received shutdown signal, starting graceful shutdown...');

    const server = getServer();
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    } else {
      process.exit(0);
    }
  };
}
