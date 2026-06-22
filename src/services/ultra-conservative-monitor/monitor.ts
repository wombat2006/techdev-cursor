import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { evaluatePhaseHealth } from './health-evaluation';
import { collectCurrentMetrics } from './metrics-collector';
import {
  buildPhaseConfigurations,
  getPreviousPhase,
  getTrafficPercentage,
} from './phase-configurations';
import { performPreTransitionSafetyCheck } from './pre-transition-check';
import type { ConservativeMetrics, PhaseConfiguration, PhaseLevel } from './types';

export class UltraConservativeMonitor extends EventEmitter {
  private static instance: UltraConservativeMonitor;
  private phases: Map<PhaseLevel, PhaseConfiguration> = new Map();
  private currentPhase: PhaseLevel = '1percent';
  private phaseStartTime?: Date;
  private baselineMetrics?: ConservativeMetrics;
  private metricsHistory: ConservativeMetrics[] = [];

  private monitoringInterval?: ReturnType<typeof setInterval>;
  private evaluationCount = 0;

  private constructor() {
    super();
    this.phases = buildPhaseConfigurations();

    logger.info('🛡️ Ultra-Conservative Monitor initialized', {
      phases: Array.from(this.phases.keys()),
      currentPhase: this.currentPhase,
    });
  }

  public static getInstance(): UltraConservativeMonitor {
    if (!UltraConservativeMonitor.instance) {
      UltraConservativeMonitor.instance = new UltraConservativeMonitor();
    }
    return UltraConservativeMonitor.instance;
  }

  public async setBaselineMetrics(): Promise<void> {
    logger.info('📊 Capturing baseline metrics for ultra-conservative monitoring');

    try {
      this.baselineMetrics = await this.collectMetrics();

      logger.info('✅ Baseline metrics established', {
        errorRate: this.baselineMetrics.errorRate,
        avgLatency: this.baselineMetrics.avgLatency,
        memoryUsage: this.baselineMetrics.memoryUsagePercent,
        consensusRate: this.baselineMetrics.consensusSuccessRate,
      });
    } catch (error) {
      logger.error('❌ Failed to establish baseline metrics', { error });
      throw new Error('Cannot proceed without baseline metrics');
    }
  }

  public async requestPhaseTransition(targetPhase: PhaseLevel): Promise<boolean> {
    const phaseConfig = this.phases.get(targetPhase);
    if (!phaseConfig) {
      throw new Error(`Invalid phase: ${targetPhase}`);
    }

    logger.warn(`🚦 PHASE TRANSITION REQUEST: ${this.currentPhase} → ${targetPhase}`, {
      currentPhase: this.currentPhase,
      targetPhase,
      trafficIncrease: `${this.getCurrentTrafficPercentage()}% → ${phaseConfig.trafficPercentage}%`,
    });

    const preTransitionCheck = performPreTransitionSafetyCheck(
      await this.collectMetrics(),
      this.currentPhase,
      targetPhase,
      this.phases,
      this.phaseStartTime
    );

    if (!preTransitionCheck.safe) {
      logger.error('🚨 Pre-transition safety check FAILED', {
        issues: preTransitionCheck.issues,
        recommendation: 'DO NOT PROCEED',
      });
      return false;
    }

    logger.info('✅ Pre-transition safety check PASSED', {
      positives: preTransitionCheck.positives,
      recommendation: 'SAFE TO PROCEED WITH EXTREME CAUTION',
    });

    return true;
  }

  public async transitionToPhase(newPhase: PhaseLevel): Promise<void> {
    const approved = await this.requestPhaseTransition(newPhase);
    if (!approved) {
      throw new Error(`Phase transition to ${newPhase} not approved`);
    }

    logger.info(`🚀 Executing transition: ${this.currentPhase} → ${newPhase}`);

    this.currentPhase = newPhase;
    this.phaseStartTime = new Date();
    this.evaluationCount = 0;

    this.startPhaseMonitoring();

    this.emit('phase-transition', {
      from: this.currentPhase,
      to: newPhase,
      timestamp: this.phaseStartTime,
    });
  }

  private startPhaseMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const config = this.phases.get(this.currentPhase)!;
    const intervalMs = config.stabilityRequirements.evaluationIntervalMinutes * 60 * 1000;

    logger.info('🔍 Starting ultra-conservative monitoring', {
      phase: this.currentPhase,
      evaluationIntervalMinutes: config.stabilityRequirements.evaluationIntervalMinutes,
      requiredStabilityHours: config.stabilityRequirements.requiredStabilityHours,
    });

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performConservativeEvaluation();
      } catch (error) {
        logger.error('❌ Conservative evaluation failed', { error });
      }
    }, intervalMs);

    this.performConservativeEvaluation();
  }

  private async performConservativeEvaluation(): Promise<void> {
    this.evaluationCount++;

    const metrics = await this.collectMetrics();
    this.metricsHistory.push(metrics);

    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }

    const evaluation = evaluatePhaseHealth(
      metrics,
      this.phases.get(this.currentPhase)!,
      this.currentPhase,
      this.phaseStartTime
    );

    logger.info(`🔍 Conservative Evaluation #${this.evaluationCount}`, {
      phase: this.currentPhase,
      status: evaluation.status,
      stabilityScore: metrics.stabilityScore,
      canProgress: evaluation.canProgressToNext,
    });

    if (evaluation.shouldEmergencyStop) {
      logger.error('🚨 EMERGENCY STOP TRIGGERED');
      this.emit('emergency-stop', evaluation);
      await this.executeEmergencyStop();
    } else if (evaluation.shouldRollbackToPrevious) {
      logger.warn('⬇️ ROLLBACK TO PREVIOUS PHASE REQUIRED');
      this.emit('rollback-required', evaluation);
      await this.executeRollbackToPrevious();
    } else if (evaluation.canProgressToNext) {
      logger.info('✅ Phase completed successfully - ready for next phase');
      this.emit('phase-ready-for-progression', evaluation);
    } else if (evaluation.status === 'warning' || evaluation.status === 'critical') {
      logger.warn(`⚠️ Phase health: ${evaluation.status}`, {
        issues: evaluation.issues,
        recommendations: evaluation.recommendations,
      });
      this.emit('phase-health-warning', evaluation);
    }
  }

  private collectMetrics(): Promise<ConservativeMetrics> {
    return collectCurrentMetrics({
      currentPhase: this.currentPhase,
      phases: this.phases,
      baselineMetrics: this.baselineMetrics,
      metricsHistory: this.metricsHistory,
      trafficPercentage: this.getCurrentTrafficPercentage(),
    });
  }

  private async executeEmergencyStop(): Promise<void> {
    logger.error('🚨 EXECUTING EMERGENCY STOP');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.currentPhase = '1percent';

    this.emit('emergency-stop-executed', {
      timestamp: new Date(),
      revertedTo: this.currentPhase,
    });
  }

  private async executeRollbackToPrevious(): Promise<void> {
    const previousPhase = getPreviousPhase(this.currentPhase);
    if (!previousPhase) return;

    logger.warn(`⬇️ Rolling back: ${this.currentPhase} → ${previousPhase}`);

    this.currentPhase = previousPhase;
    this.phaseStartTime = new Date();

    this.startPhaseMonitoring();

    this.emit('rollback-executed', {
      from: this.currentPhase,
      to: previousPhase,
      timestamp: new Date(),
    });
  }

  private getCurrentTrafficPercentage(): number {
    return getTrafficPercentage(this.phases, this.currentPhase);
  }

  public getStatus(): object {
    return {
      currentPhase: this.currentPhase,
      trafficPercentage: this.getCurrentTrafficPercentage(),
      phaseStartTime: this.phaseStartTime,
      evaluationCount: this.evaluationCount,
      metricsHistoryLength: this.metricsHistory.length,
      stabilityScore: this.metricsHistory[this.metricsHistory.length - 1]?.stabilityScore || 0,
      monitoringActive: !!this.monitoringInterval,
    };
  }
}
