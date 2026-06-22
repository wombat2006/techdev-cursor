import type { ApprovalAuditLogEntry } from './types';

export function exportAuditLogEntries(
  auditLog: ApprovalAuditLogEntry[],
  startTime?: number,
  endTime?: number
): Array<ApprovalAuditLogEntry & { timestamp_iso: string }> {
  const start = startTime ?? 0;
  const end = endTime ?? Date.now();

  return auditLog
    .filter((log) => log.timestamp >= start && log.timestamp <= end)
    .map((log) => ({
      ...log,
      timestamp_iso: new Date(log.timestamp).toISOString(),
    }));
}
