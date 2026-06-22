import { createGracefulShutdown } from '../../src/server/lifecycle';
import { createServer } from '../../src/server/test-factory';

jest.mock('../../src/server/routes', () => ({
  registerAppRoutes: jest.fn(),
  registerStaticRoutes: jest.fn(),
}));
jest.mock('../../src/server/llm-health', () => ({
  registerLlmHealthRoute: jest.fn(),
}));
jest.mock('../../src/metrics/prometheus-client', () => ({
  initializeMetrics: jest.fn(),
  register: { contentType: 'text/plain', metrics: jest.fn(async () => '') },
}));

describe('server SRP modules', () => {
  describe('test-factory', () => {
    it('createServer returns express app and closable mock server', () => {
      const { app, server } = createServer();
      expect(typeof app).toBe('function');
      expect(typeof server.close).toBe('function');
    });
  });

  describe('lifecycle', () => {
    it('createGracefulShutdown exits cleanly when no server is bound', () => {
      const shutdown = createGracefulShutdown(() => null);
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      shutdown();
      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });
  });

  describe('techsapo-server', () => {
    it('TechSapoServer exposes express app without listening', async () => {
      const { TechSapoServer } = await import('../../src/server/techsapo-server');
      const server = new TechSapoServer();
      const app = server.getApp();
      expect(app).toBeDefined();
      expect(typeof app.get).toBe('function');
    });
  });
});
