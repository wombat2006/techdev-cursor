import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../utils/logger';
import { parseJSONOutput, parseMCPResponses } from './output-parser';
import type { CodexExecutionContext, CodexMCPConfig } from './types';

export interface CodexExecutorOptions {
  config: CodexMCPConfig;
  activeProcesses: Map<string, ChildProcess>;
}

export async function executeCodex(
  execOptions: CodexExecutorOptions,
  prompt: string,
  model: string,
  sandbox: string,
  context: CodexExecutionContext,
  cliOptions?: {
    reasoning_effort?: string;
    verbosity?: string;
  }
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  session_id?: string;
  events?: any[];
}> {
  return new Promise((resolve) => {
    const sessionId = context.session_id || `session-${Date.now()}`;

    // Prepare environment
    const env = {
      ...process.env,
      RUST_LOG: execOptions.config.rust_log_level || 'info'
    };

    // Build command based on mode
    let args: string[];
    if (context.mode === 'ci' || context.mode === 'non-interactive') {
      args = ['exec', '--model', model, '--json'];
      if (context.full_auto) {
        args.push('--full-auto');
      }
      if (sandbox !== 'read-only') {
        args.push('--sandbox', sandbox);
      }
      args.push('--skip-git-repo-check');
      // Add prompt as final argument for non-interactive mode
      args.push(prompt);
    } else {
      // Interactive mode with MCP
      args = ['mcp', 'serve'];
    }

    logger.info('🚀 Starting Codex process', {
      sessionId,
      mode: context.mode,
      model,
      sandbox,
      args: args.slice(0, -1) // Don't log the full prompt
    });

    const codexProcess = spawn('codex', args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: execOptions.config.working_directory || process.cwd()
    });

    execOptions.activeProcesses.set(sessionId, codexProcess);

    let stdout = '';
    let stderr = '';
    const events: any[] = [];
    let finalResponse = '';

    // Set timeout
    const timeout = setTimeout(() => {
      codexProcess.kill('SIGTERM');
      execOptions.activeProcesses.delete(sessionId);
      resolve({
        success: false,
        error: 'Execution timeout',
        session_id: sessionId
      });
    }, execOptions.config.session_timeout_ms || 300000);

    // Handle stdout
    codexProcess.stdout?.on('data', (data) => {
      stdout += data.toString();

      if (context.mode === 'interactive') {
        // Parse MCP responses
        parseMCPResponses(data.toString(), events, (response) => {
          finalResponse = response;
        });
      } else {
        // Parse JSON output for non-interactive mode
        parseJSONOutput(data.toString(), events, (response) => {
          finalResponse = response;
        });
      }
    });

    // Handle stderr
    codexProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      logger.debug('Codex stderr', { sessionId, data: data.toString() });
    });

    // Handle process completion
    codexProcess.on('close', (code) => {
      clearTimeout(timeout);
      execOptions.activeProcesses.delete(sessionId);

      const success = code === 0 && (finalResponse.length > 0 || context.mode === 'ci');

      resolve({
        success,
        response: finalResponse || stdout || undefined,
        error: success ? undefined : (stderr || `Process exited with code ${code}`),
        session_id: sessionId,
        events
      });
    });

    // Handle process error
    codexProcess.on('error', (error) => {
      clearTimeout(timeout);
      execOptions.activeProcesses.delete(sessionId);
      resolve({
        success: false,
        error: `Process error: ${error.message}`,
        session_id: sessionId
      });
    });

    // Send input if interactive mode
    if (context.mode === 'interactive') {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'codex',
          arguments: {
            prompt,
            model,
            sandbox,
            ...cliOptions
          }
        }
      };

      codexProcess.stdin?.write(JSON.stringify(mcpRequest) + '\n');
      codexProcess.stdin?.end();
    }
  });
}
