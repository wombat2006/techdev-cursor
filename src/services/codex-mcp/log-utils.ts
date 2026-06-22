import fs from 'fs/promises';
import path from 'path';
import type { ChildProcess } from 'child_process';
import type { CodexMCPConfig } from './types';

export async function getRecentLogs(logDirectory: string): Promise<string> {
  try {
    const logFile = path.join(logDirectory, 'codex-tui.log');
    const content = await fs.readFile(logFile, 'utf-8');

    // Return last 50 lines
    const lines = content.split('\n');
    return lines.slice(-50).join('\n');
  } catch (error) {
    return `Unable to read logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function getPerformanceStats(
  sessionManager: { getSessionStats: () => Promise<unknown> },
  activeProcesses: Map<string, ChildProcess>,
  config: CodexMCPConfig
): Promise<Record<string, unknown>> {
  const stats = await sessionManager.getSessionStats();

  return {
    sessions: stats,
    active_processes: activeProcesses.size,
    config: config,
    uptime_ms: process.uptime() * 1000,
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
}
