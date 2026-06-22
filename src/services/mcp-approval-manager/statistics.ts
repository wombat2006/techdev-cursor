import type { ApprovalAuditLogEntry } from './types';

export function computeApprovalStatistics(
  auditLog: ApprovalAuditLogEntry[],
  pendingCount: number,
  timeWindow: number = 24 * 60 * 60 * 1000,
  now: number = Date.now()
): {
  total_requests: number;
  approved: number;
  rejected: number;
  auto_approved: number;
  pending: number;
  by_risk_level: Record<string, number>;
  by_tool: Record<string, number>;
} {
  const cutoff = now - timeWindow;
  const recentLogs = auditLog.filter((log) => log.timestamp >= cutoff);

  const stats = {
    total_requests: 0,
    approved: 0,
    rejected: 0,
    auto_approved: 0,
    pending: pendingCount,
    by_risk_level: {} as Record<string, number>,
    by_tool: {} as Record<string, number>,
  };

  for (const log of recentLogs) {
    if (log.action === 'approval_requested') {
      stats.total_requests++;

      const riskLevel = String(log.details.risk_level ?? 'unknown');
      stats.by_risk_level[riskLevel] = (stats.by_risk_level[riskLevel] || 0) + 1;

      const tool = String(log.details.tool ?? 'unknown');
      stats.by_tool[tool] = (stats.by_tool[tool] || 0) + 1;
    } else if (log.action === 'approval_granted') {
      if (log.details.approved_by === 'system_policy') {
        stats.auto_approved++;
      } else {
        stats.approved++;
      }
    } else if (log.action === 'approval_denied') {
      stats.rejected++;
    }
  }

  return stats;
}
