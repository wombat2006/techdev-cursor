export function generateApprovalRequestId(now: number = Date.now()): string {
  return `mcpap_${now}_${Math.random().toString(36).slice(2, 11)}`;
}
