import { spawn } from 'child_process';
import type { AdapterRequest, AdapterResult, ProviderAdapter } from '../types/adapter-types';
import { buildFullPrompt } from './inference-profile-resolver';

const DEFAULT_MODEL = 'sonnet';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export class ClaudeAdapter implements ProviderAdapter {
  readonly providerId = 'claude' as const;

  async invoke(request: AdapterRequest): Promise<AdapterResult> {
    const start = Date.now();
    const model = request.profile.model ?? DEFAULT_MODEL;
    const fullPrompt = buildFullPrompt(request.prompt, request.context, request.profile.cot);
    const cwd = request.workingDirectory ?? process.cwd();

    const args = ['--print', '--model', model, '--strict-mcp-config'];
    if (request.profile.effort) {
      args.push('--effort', request.profile.effort);
    }

    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    try {
      const content = await this.runClaude(args, fullPrompt, cwd, env);
      return {
        success: true,
        content,
        executionTimeMs: Date.now() - start,
        provider: this.providerId,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - start,
        provider: this.providerId,
        model,
      };
    }
  }

  private runClaude(
    args: string[],
    prompt: string,
    cwd: string,
    env: NodeJS.ProcessEnv
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('claude', args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGTERM');
        reject(new Error(`Claude CLI timeout after ${DEFAULT_TIMEOUT_MS}ms`));
      }, DEFAULT_TIMEOUT_MS);

      child.stdin?.write(prompt);
      child.stdin?.end();

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const filteredStderr = stderr
          .split('\n')
          .filter((line) => !line.includes('DeprecationWarning'))
          .join('\n')
          .trim();
        if (code === 0) {
          resolve(stdout.trim());
          return;
        }
        reject(new Error(`Claude CLI exit ${code}${filteredStderr ? `: ${filteredStderr}` : ''}`));
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

export const claudeAdapter = new ClaudeAdapter();
