import { DataSanitizer } from '../../utils/data-sanitizer';
import {
  analyzeApplicationLogs,
  analyzeGeneralLogs,
  analyzeKernelLogs,
  analyzeMysqlLogs,
  analyzeNginxLogs,
  analyzeSystemdLogs,
} from './domain-analyzers';
import { detectLogType } from './error-context';
import { logger } from './logger';
import type { LogAnalysisRequest, LogAnalysisResult } from './types';
import { performMandatoryWallBounceAnalysis } from './wall-bounce-pipeline';

export async function analyzeLogs(request: LogAnalysisRequest): Promise<LogAnalysisResult> {
  logger.info('🔄 Starting UNIVERSAL MANDATORY Wall-Bounce Analysis', {
    hasUserCommand: !!request.user_command,
    systemContext: request.system_context,
    logType: request.log_type || 'general',
    wallBounceRequired: true,
    policy: 'ALL_REQUESTS_REQUIRE_WALL_BOUNCE',
  });

  const sanitizationResult = DataSanitizer.sanitizeForExternalAPI(request.error_output);
  if (sanitizationResult.riskLevel === 'high') {
    logger.warn('High-risk data detected in log analysis request', {
      detectedPatterns: sanitizationResult.detectedPatterns,
    });
  }

  const sanitizedErrorOutput = sanitizationResult.sanitizedText;

  try {
    const wallBounceAnalysis = await performMandatoryWallBounceAnalysis({
      user_command: request.user_command,
      error_output: sanitizedErrorOutput,
      system_context: request.system_context,
    });

    if (wallBounceAnalysis) {
      logger.info('🎯 Wall-Bounce Analysis completed successfully', {
        analysisType: 'collaborative_multi_llm',
        confidenceScore: wallBounceAnalysis.confidence_score,
        problemCategory: wallBounceAnalysis.problem_category,
      });
      return wallBounceAnalysis;
    }
  } catch (error) {
    logger.error('🚨 Wall-Bounce Analysis failed - attempting fallback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  logger.error('🚨 EMERGENCY: Using fallback single-LLM analysis - Wall-bounce system failed');
  logger.error('⚠️  WARNING: Analysis quality significantly reduced without wall-bounce collaboration');

  const logType = request.log_type || detectLogType(sanitizedErrorOutput, request.user_command);
  logger.info('Log type determined', { logType });

  let analysis: LogAnalysisResult;
  switch (logType) {
    case 'systemd':
      analysis = await analyzeSystemdLogs(sanitizedErrorOutput, request.user_command, request.system_context);
      break;
    case 'nginx':
      analysis = analyzeNginxLogs(sanitizedErrorOutput, request.user_command, request.system_context);
      break;
    case 'mysql':
      analysis = analyzeMysqlLogs(sanitizedErrorOutput, request.user_command, request.system_context);
      break;
    case 'kernel':
      analysis = analyzeKernelLogs(sanitizedErrorOutput, request.user_command, request.system_context);
      break;
    case 'application':
      analysis = analyzeApplicationLogs(sanitizedErrorOutput, request.user_command, request.system_context);
      break;
    default:
      analysis = analyzeGeneralLogs(sanitizedErrorOutput, request.user_command, request.system_context);
  }

  analysis.problem_category += ' [🚨 EMERGENCY FALLBACK - Wall-bounce collaboration failed]';
  analysis.confidence_score = Math.max(0.3, analysis.confidence_score - 0.3);
  analysis.solution_steps.unshift(
    '🚨 WARNING: This analysis used single-LLM fallback due to wall-bounce system failure'
  );
  analysis.solution_steps.unshift(
    '⚠️  RECOMMENDATION: Retry request to attempt wall-bounce analysis, or escalate to premium/critical support'
  );
  analysis.additional_checks.unshift(
    '🚨 Analysis quality significantly reduced without multi-LLM collaboration'
  );
  analysis.additional_checks.unshift(
    '🔄 Wall-bounce analysis unavailable - consider system diagnostics or retry'
  );
  analysis.collaboration_trace = {
    fallback: {
      reason: 'Wall-bounce collaboration unavailable - single-LLM fallback invoked',
    },
  };

  logger.error('EMERGENCY fallback analysis completed with reduced quality', {
    issueIdentified: analysis.issue_identified,
    problemCategory: analysis.problem_category,
    severityLevel: analysis.severity_level,
    confidenceScore: analysis.confidence_score,
    qualityReduction: 'SIGNIFICANT',
    recommendedAction: 'RETRY_OR_ESCALATE',
  });

  return analysis;
}
