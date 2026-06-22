import { emergencyDisableSRP } from '../../config/feature-flags';
import { logger } from '../../utils/logger';
import type { SafetyAlert } from './types';

export async function executeEmergencyRollback(
  alert: SafetyAlert,
  onComplete: (record: object) => void
): Promise<void> {
  try {
    logger.error('🚨 EXECUTING EMERGENCY SRP ROLLBACK');

    emergencyDisableSRP();

    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      trigger: alert,
      phase: 'phase3_5percent',
      cause: 'Automated safety system',
      metricsAtRollback: alert.metrics,
    };

    logger.error('💾 Emergency rollback executed', rollbackRecord);
    onComplete(rollbackRecord);
    logger.error('✅ Emergency rollback completed successfully');
  } catch (error) {
    logger.error('❌ Emergency rollback failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      originalAlert: alert,
    });
  }
}
