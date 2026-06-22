import { analyzeLogs } from './analyze-entry';
export type { LogAnalysisRequest, LogAnalysisResult, CollaborationTrace, ErrorContext } from './types';
export class LogAnalyzer {
  static analyzeLogs = analyzeLogs;
}
