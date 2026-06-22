import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

export function createServer(): { app: express.Application; server: { close: (callback?: () => void) => void } } {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      services: {
        redis: 'ok',
        sessionManager: 'ok',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/v1/generate', (req, res) => {
    const { prompt, task_type, user_id, session_id } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (task_type && !['basic', 'premium', 'critical'].includes(task_type)) {
      return res.status(400).json({ error: 'Invalid task_type' });
    }

    res.json({
      response: `Mock response for: ${prompt}`,
      session_id: session_id || `sess_${Date.now()}`,
      task_type: task_type || 'basic',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/v1/analyze-logs', (req, res) => {
    const { user_command, error_output, system_context } = req.body;

    if (!user_command || !error_output) {
      return res.status(400).json({
        error: 'user_command and error_output are required',
      });
    }

    res.json({
      analysis_result: {
        command: user_command,
        error: error_output,
        context: system_context,
        suggestions: ['Check service status', 'Verify configuration'],
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      path: req.path,
    });
  });

  app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  const mockServer = {
    close: (callback?: () => void) => {
      if (callback) callback();
    },
  };

  return { app, server: mockServer };
}
