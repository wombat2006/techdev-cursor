import { logger } from './logger';
import type { ErrorContext } from './types';
import { performComprehensiveAnalysis } from './comprehensive-analysis';

export async function getSystemdTroubleshootingKnowledge(errorType: string): Promise<string> {
  // This would integrate with Context7 for real-time systemd knowledge
  // For now, return relevant knowledge based on error type
  const knowledgeMap: Record<string, string> = {
    'port_conflict': 'port binding conflicts and service port management',
    'permission_error': 'service executable access and permission troubleshooting',
    'core_dump': 'service crash diagnosis and SECCOMP troubleshooting',
    'connection_error': 'network connectivity and port binding issues',
    'startup_failure': 'service startup dependencies and configuration',
    'timeout_error': 'service timeout configuration and resource issues',
    'dependency_error': 'systemd dependency resolution and ordering'
  };

  return knowledgeMap[errorType] || 'general systemd service troubleshooting';
}

/**
 * Perform comprehensive AI-powered analysis using Claude's native capabilities
 */
export async function performAIAnalysis(errorAnalysis: ErrorContext, systemdKnowledge: string): Promise<any | null> {
  // 🧠 Direct AI Analysis: Use Claude's comprehensive reasoning
  const { serviceName, exitCode, executable, errorType, systemInfo } = errorAnalysis;
  const errorOutput = systemInfo.originalError;
  const userCommand = systemInfo.userCommand;
  const systemContext = systemInfo.context;
  
  logger.debug('Applying systemd troubleshooting knowledge', {
    errorType,
    knowledge: systemdKnowledge
  });

  // Comprehensive error analysis using native AI reasoning
  return performComprehensiveAnalysis(errorOutput, serviceName, userCommand, systemContext, exitCode, executable);
}
