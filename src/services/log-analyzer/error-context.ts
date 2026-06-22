import { logger } from './logger';
import type { ErrorContext, LogAnalysisResult } from './types';
import { getSystemdTroubleshootingKnowledge, performAIAnalysis } from './systemd-ai';

export function detectLogType(errorOutput: string, userCommand?: string): string {
  const content = errorOutput.toLowerCase();
  const command = userCommand?.toLowerCase() || '';

  // Enhanced systemd patterns - include service-specific errors
  if (content.includes('systemctl') || content.includes('systemd') || 
      content.includes('failed to start') || content.includes('unit') ||
      content.includes('[  ok  ]') || content.includes('active (running)') ||
      content.includes('.service') || content.includes('permission denied') && content.includes('/usr/sbin/') ||
      content.includes('control process exited') || content.includes('code=dumped')) {
    return 'systemd';
  }

  // Enhanced nginx patterns - include SECCOMP and specific nginx errors
  if (content.includes('nginx') || content.includes('access.log') ||
      content.includes('error.log') || command.includes('nginx') ||
      content.includes('seccomp') && command.includes('nginx')) {
    return 'nginx';
  }

  // Enhanced mysql patterns - include authentication errors
  if (content.includes('mysql') || content.includes('mariadb') ||
      content.includes('connection refused') && content.includes('3306') ||
      content.includes('access denied') && (content.includes('using password') || content.includes('28000'))) {
    return 'mysql';
  }

  // kernel patterns
  if (content.includes('kernel') || content.includes('dmesg') ||
      content.includes('segmentation fault') || content.includes('oops')) {
    return 'kernel';
  }

  return 'general';
}

/**
 * Extract structured error context for dynamic analysis
 */
export function extractErrorContext(errorOutput: string, userCommand?: string, systemContext?: string): ErrorContext {
  // Extract service name
  const serviceMatch = errorOutput.match(/([a-zA-Z0-9\-_]+)\.service/);
  const serviceName = serviceMatch ? serviceMatch[1] : null;

  // Extract exit code
  const exitCodeMatch = errorOutput.match(/code=(\w+).*?status=(\d+)/);
  const exitCode = exitCodeMatch ? { code: exitCodeMatch[1], status: exitCodeMatch[2] } : null;

  // Extract executable path
  const execMatch = errorOutput.match(/executable\s+([^\s:]+)/i);
  const executable = execMatch ? execMatch[1] : null;

  // Extract error type
  const errorType = classifyErrorType(errorOutput);

  // Extract system information
  const systemInfo = {
    context: systemContext,
    userCommand: userCommand,
    originalError: errorOutput
  };

  return {
    serviceName,
    exitCode,
    executable,
    errorType,
    systemInfo,
    timestamp: new Date().toISOString()
  };
}

/**
 * Classify error type for targeted analysis
 */
export function classifyErrorType(errorOutput: string): string {
  const content = errorOutput.toLowerCase();
  
  // Port binding conflicts - Critical for service startup
  if (content.includes('address already in use') || 
      content.includes('bind()') || 
      (content.includes('port') && content.includes('use'))) return 'port_conflict';
  
  if (content.includes('permission denied')) return 'permission_error';
  if (content.includes('code=dumped')) return 'core_dump';
  if (content.includes('connection refused')) return 'connection_error';
  if (content.includes('failed to start')) return 'startup_failure';
  if (content.includes('timeout')) return 'timeout_error';
  if (content.includes('dependency')) return 'dependency_error';
  
  return 'general_error';
}

/**
 * Generate dynamic solution using Context7 systemd knowledge and AI analysis
 */
export async function generateDynamicSolution(errorAnalysis: ErrorContext): Promise<LogAnalysisResult | null> {
  try {
    // 🎯 Context7 Integration: Get relevant systemd troubleshooting knowledge
    const systemdKnowledge = await getSystemdTroubleshootingKnowledge(errorAnalysis.errorType);
    
    // 🧠 AI Analysis: Generate contextual solution
    const aiAnalysis = await performAIAnalysis(errorAnalysis, systemdKnowledge);
    
    if (aiAnalysis) {
      return {
        issue_identified: true,
        problem_category: aiAnalysis.problemCategory,
        root_cause: aiAnalysis.rootCause,
        solution_steps: aiAnalysis.solutionSteps,
        related_services: aiAnalysis.relatedServices || [],
        severity_level: aiAnalysis.severityLevel,
        confidence_score: aiAnalysis.confidenceScore,
        additional_checks: aiAnalysis.additionalChecks || []
      };
    }

    return null;
  } catch (error) {
    logger.error('Dynamic solution generation failed', { error: error instanceof Error ? error.message : error });
    return null;
  }
}
