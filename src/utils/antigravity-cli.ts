/**
 * Antigravity CLI (`agy`) spawn helper — Google Tier 1 provider transport.
 * Uses stdin + `--print` (prompt as CLI arg hangs on long input).
 */

import { spawn } from 'child_process';
import { logger } from './logger';

const DEFAULT_BIN = process.env.ANTIGRAVITY_CLI_BIN || 'agy';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export interface AgyExecuteOptions {
  model: string;
  timeoutMs?: number;
  onChunk?: (chunk: string) => void;
}

export interface AgyExecuteResult {
  content: string;
  stderr: string;
}

export function resolveAntigravityBin(): string {
  return DEFAULT_BIN;
}

export async function checkAntigravityVersion(timeoutMs = 5000): Promise<{ ok: boolean; version: string }> {
  return new Promise((resolve) => {
    const child = spawn(DEFAULT_BIN, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ ok: false, version: 'timeout' });
    }, timeoutMs);

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        version: stdout.trim() || 'unknown',
      });
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve({ ok: false, version: 'unavailable' });
    });
  });
}

export async function executeAgyPrint(
  prompt: string,
  options: AgyExecuteOptions
): Promise<AgyExecuteResult> {
  const args = ['--print', '--model', options.model];
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  logger.info('Antigravity CLI execution start', {
    command: DEFAULT_BIN,
    model: options.model,
    promptLength: prompt.length,
  });

  return new Promise((resolve, reject) => {
    const child = spawn(DEFAULT_BIN, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      reject(new Error(`Antigravity CLI timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdin?.write(prompt);
    child.stdin?.end();

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      options.onChunk?.(chunk);
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
        .filter((line) => !line.includes('DeprecationWarning') && !line.includes('punycode'))
        .join('\n')
        .trim();

      if (code === 0) {
        resolve({ content: stdout.trim(), stderr: filteredStderr });
        return;
      }

      reject(
        new Error(
          `Antigravity CLI exit code: ${code}${filteredStderr ? `, stderr: ${filteredStderr}` : ''}`
        )
      );
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Antigravity CLI spawn error: ${error.message}`));
    });
  });
}
