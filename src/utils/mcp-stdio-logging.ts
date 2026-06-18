/**
 * MCP stdio servers must not write to stdout (JSON-RPC transport).
 * Call before any logger output when running as an MCP server process.
 */

import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { logger } from './logger';

const MCP_LOG_FILE = path.join(process.cwd(), 'logs', 'mcp-providers.log');

export function configureLoggerForMcpStdio(): void {
  if (process.env.TECHSAPO_MCP_STDIO === '0') {
    return;
  }

  fs.mkdirSync(path.dirname(MCP_LOG_FILE), { recursive: true });

  logger.clear();
  logger.add(
    new winston.transports.File({
      filename: MCP_LOG_FILE,
      level: process.env.LOG_LEVEL || 'info',
    })
  );
  logger.add(
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      level: 'warn',
    })
  );
}
