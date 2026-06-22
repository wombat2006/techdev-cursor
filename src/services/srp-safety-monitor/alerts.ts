import type { SafetyAlert, SafetyAlertDraft } from './types';

export function getActionRequiredForAlert(
  level: SafetyAlert['level'],
  category: SafetyAlert['category']
): string {
  if (category === 'system' && level !== 'info') {
    return 'Initiate infrastructure diagnostic runbook';
  }
  switch (level) {
    case 'emergency':
      return 'IMMEDIATE AUTO-ROLLBACK';
    case 'critical':
      return 'Evaluate for manual rollback';
    case 'warning':
      return 'Increase monitoring frequency';
    case 'info':
    default:
      return 'Monitor and log';
  }
}

export function buildSafetyAlert(draft: SafetyAlertDraft): SafetyAlert {
  return {
    ...draft,
    timestamp: new Date(),
    actionRequired: getActionRequiredForAlert(draft.level, draft.category),
  };
}

export function trimAlertHistory(alerts: SafetyAlert[], maxEntries: number = 50): SafetyAlert[] {
  return alerts.length > maxEntries ? alerts.slice(-maxEntries) : alerts;
}
