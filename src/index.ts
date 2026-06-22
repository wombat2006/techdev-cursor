import { logger } from './utils/logger';
import { TechSapoServer } from './server/techsapo-server';

export { TechSapoServer } from './server/techsapo-server';
export { createServer } from './server/test-factory';

export default TechSapoServer;

if (require.main === module) {
  const server = new TechSapoServer();
  server.start().catch((error) => {
    logger.error('Failed to start application', error);
    process.exit(1);
  });
}
