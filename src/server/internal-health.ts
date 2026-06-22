import http from 'http';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export async function fetchInternalHealthStatus(): Promise<{
  status: string;
  services: Record<string, string>;
}> {
  return new Promise((resolve) => {
    try {
      const options = {
        hostname: 'localhost',
        port: config.server.port,
        path: '/health',
        method: 'GET',
        headers: {
          'User-Agent': 'TechSapo-Internal-Health-Check',
          'X-Internal-Request': 'true',
        },
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const healthData = JSON.parse(data);
              resolve({
                status: healthData.status || 'ok',
                services: healthData.services || {},
              });
            } else {
              resolve({
                status: 'degraded',
                services: { health_endpoint: 'unavailable' },
              });
            }
          } catch {
            resolve({
              status: 'degraded',
              services: { health_endpoint: 'parse_error' },
            });
          }
        });
      });

      req.on('error', (error) => {
        logger.warn('Internal health check failed', error);
        resolve({
          status: 'degraded',
          services: { health_endpoint: 'error' },
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'degraded',
          services: { health_endpoint: 'timeout' },
        });
      });

      req.end();
    } catch (error) {
      logger.warn('Internal health check failed', error);
      resolve({
        status: 'degraded',
        services: { health_endpoint: 'error' },
      });
    }
  });
}
