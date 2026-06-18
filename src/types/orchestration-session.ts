/** TS-22 Layer A — OrchestrationSession transcript types (schema v1.1). */

import type { InferenceProfile } from './inference-profile';

export const ORCHESTRATION_SESSION_SCHEMA_VERSION = '1.1' as const;

export type OrchestrationSessionSchemaVersion =
  typeof ORCHESTRATION_SESSION_SCHEMA_VERSION;

/** ISO 8601 UTC instant, e.g. 2026-06-18T12:34:56.789Z */
export type IsoDateTimeUtc = string;

/** IANA timezone, e.g. Asia/Tokyo — session-scoped display context */
export type IanaTimezone = string;

export interface OrchestrationEventBase {
  eventId: string;
  seq: number;
  /** Interval start (UTC), or sole instant when tsEnd omitted */
  ts: IsoDateTimeUtc;
  /** Interval end (UTC); required on span events such as provider_result */
  tsEnd?: IsoDateTimeUtc;
  /** Denormalized span; SHOULD equal tsEnd − ts when both set */
  durationMs?: number;
}

export type OrchestrationEvent =
  | (OrchestrationEventBase & { type: 'user_prompt'; content: string })
  | (OrchestrationEventBase & {
      type: 'provider_invoke';
      provider: 'claude' | 'codex' | 'agy';
      profile: InferenceProfile;
      promptHash: string;
    })
  | (OrchestrationEventBase & {
      type: 'provider_result';
      invokeEventId: string;
      provider: string;
      content: string;
      success: boolean;
      latencyMs: number;
      tsEnd: IsoDateTimeUtc;
    })
  | (OrchestrationEventBase & {
      type: 'round_consensus';
      round: number;
      confidence: number;
      consensus: number;
      summary: string;
      tsEnd: IsoDateTimeUtc;
    })
  | (OrchestrationEventBase & {
      type: 'aggregator';
      model: string;
      content: string;
    })
  | (OrchestrationEventBase & {
      type: 'layer_c_retrieval';
      source: 'cipher' | 'rag';
      refIds: string[];
    })
  | (OrchestrationEventBase & {
      type: 'session_summarized';
      reason: 'event_count' | 'size_bytes';
      eventsBefore: number;
      summary: string;
    });

export interface ProviderHandleClaude {
  resumeId?: string;
  lastModel?: string;
  lastUsedAt?: IsoDateTimeUtc;
}

export interface ProviderHandleCodex {
  sessionId?: string;
  conversationId?: string;
  lastUsedAt?: IsoDateTimeUtc;
}

export interface ProviderHandleAgy {
  conversationId?: string;
  lastCwd?: string;
  lastUsedAt?: IsoDateTimeUtc;
}

export interface OrchestrationSession {
  schemaVersion: OrchestrationSessionSchemaVersion;
  sessionId: string;
  conversationId?: string;
  createdAt: IsoDateTimeUtc;
  updatedAt: IsoDateTimeUtc;
  expiresAt: IsoDateTimeUtc;
  /** Optional IANA TZ for UI / audit — not duplicated on each event */
  clientTimezone?: IanaTimezone;
  events: OrchestrationEvent[];
  providerHandles: {
    claude?: ProviderHandleClaude;
    codex?: ProviderHandleCodex;
    agy?: ProviderHandleAgy;
  };
  stats?: {
    eventCount: number;
    lastSeq: number;
    lastRound?: number;
  };
  metadata?: Record<string, unknown>;
}
