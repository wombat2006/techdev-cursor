export interface LogAnalysisRequest {
  user_command?: string;
  error_output: string;
  system_context?: string;
  log_type?: 'systemd' | 'application' | 'kernel' | 'nginx' | 'mysql' | 'general';
}

export interface CollaborationTrace {
  openai_codex_gpt_5?: {
    root_cause: string;
    mechanism: string;
    resolution: string[];
    prevention: string[];
  };
  gemini_environment?: {
    environment_factors: string[];
    configuration_issues: string[];
    adjusted_resolution: string[];
  };
  claude_integration?: {
    integrated_root_cause: string;
    prioritized_solutions: string[];
    confidence: number;
  };
  fallback?: {
    reason: string;
  };
}

export interface LogAnalysisResult {
  issue_identified: boolean;
  problem_category: string;
  root_cause: string;
  solution_steps: string[];
  related_services: string[];
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  additional_checks: string[];
  collaboration_trace?: CollaborationTrace;
}

export interface ErrorContext {
  serviceName: string | null;
  exitCode: { code: string; status: string } | null;
  executable: string | null;
  errorType: string;
  systemInfo: {
    context?: string;
    userCommand?: string;
    originalError: string;
  };
  timestamp: string;
}
