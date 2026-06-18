import { spawn } from 'child_process';
import type { AdapterRequest, AdapterResult, ProviderAdapter } from '../types/adapter-types';
import { buildFullPrompt } from './inference-profile-resolver';

const DEFAULT_MODEL = 'gpt-5-codex';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export class CodexAdapter implements ProviderAdapter {
  readonly providerId = 'codex' as const;

  async invoke(request: AdapterRequest): Promise<AdapterResult> {
    const start = Date.now();
    const model = request.profile.model ?? DEFAULT_MODEL;
    const fullPrompt = buildFullPrompt(request.prompt, request.context, request.profile.cot);
    const cwd = request.workingDirectory ?? process.cwd();

    const args = [
      'exec',
      '--model',
      model,
      '--skip-git-repo-check',
      '-c',
      'approval_policy="never"',
      fullPrompt,
    ];

    try {
      const content = await this.runCodex(args, cwd);
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

  private runCodex(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('codex', args, {
        cwd,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGTERM');
        reject(new Error(`Codex CLI timeout after ${DEFAULT_TIMEOUT_MS}ms`));
      }, DEFAULT_TIMEOUT_MS);

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
        if (code === 0 || (code === null && stdout)) {
          resolve(this.extractCodexContent(stdout));
          return;
        }
        reject(new Error(`Codex CLI exit ${code}${stderr ? `: ${stderr.trim()}` : ''}`));
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private extractCodexContent(stdout: string): string {
    const codexMarker = '] codex';
    const tokensMarker = '] tokens used:';
    const codexIndex = stdout.lastIndexOf(codexMarker);
    if (codexIndex !== -1) {
      let after = stdout.substring(codexIndex + codexMarker.length);
      const tokensIndex = after.indexOf(tokensMarker);
      if (tokensIndex !== -1) {
        after = after.substring(0, tokensIndex);
      }
      return after.trim();
    }
    return stdout.trim();
  }
}

export const codexAdapter = new CodexAdapter();
