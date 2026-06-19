/**
 * TS-21 minimal catalog loader — Contract Layer (F-2 subset).
 * Load + alias resolve + nativeModelFlag; no TaskRouter yet.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { ProviderId } from '../types/adapter-types';
import type { InferencePreset } from '../types/inference-profile';
import type { LlmModelCatalog, ModelCatalogEntry } from '../types/llm-model-catalog';

/** Known subscription-CLI peer adapters (Wall-Bounce constitution). */
export const CONSTITUTION_PEER_ADAPTER_IDS = ['claude', 'codex', 'agy'] as const;

export type ConstitutionPeerAdapterId = (typeof CONSTITUTION_PEER_ADAPTER_IDS)[number];

/** Invocation adapter key — open string; extend when shipping new native/routed adapters. */
export type AdapterId = string;

export interface AdapterPresetMatrix {
  version: string;
  description?: string;
  /** Subset of adapters.adapters keys required for Wall-Bounce peer rounds (Track C). */
  constitutionPeerAdapters?: AdapterId[];
  adapters: Record<AdapterId, Record<InferencePreset, string>>;
}

const REPO_ROOT = join(__dirname, '..', '..');

const PRESETS: InferencePreset[] = ['fast', 'balanced', 'deep', 'critical'];

let catalogCache: LlmModelCatalog | null = null;
let matrixCache: AdapterPresetMatrix | null = null;

function readJsonFile<T>(relativePath: string): T {
  const absolutePath = join(REPO_ROOT, relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf-8')) as T;
}

export function resetCatalogLoaderCache(): void {
  catalogCache = null;
  matrixCache = null;
}

export function loadLlmModelCatalog(): LlmModelCatalog {
  if (!catalogCache) {
    catalogCache = readJsonFile<LlmModelCatalog>('config/llm-model-catalog.json');
  }
  return catalogCache;
}

export function loadAdapterPresetMatrix(): AdapterPresetMatrix {
  if (!matrixCache) {
    matrixCache = readJsonFile<AdapterPresetMatrix>('config/adapter-preset-matrix.json');
  }
  return matrixCache;
}

/** @deprecated Use loadAdapterPresetMatrix */
export function loadProviderPresetBindings(): AdapterPresetMatrix {
  return loadAdapterPresetMatrix();
}

export function listMatrixAdapterIds(): AdapterId[] {
  return Object.keys(loadAdapterPresetMatrix().adapters);
}

export function listConstitutionPeerAdapterIds(): AdapterId[] {
  const matrix = loadAdapterPresetMatrix();
  return matrix.constitutionPeerAdapters ?? [...CONSTITUTION_PEER_ADAPTER_IDS];
}

export function getModelById(modelId: string): ModelCatalogEntry | undefined {
  const catalog = loadLlmModelCatalog();
  return catalog.models.find((entry) => entry.id === modelId);
}

export function resolveCatalogAlias(name: string): string | undefined {
  const catalog = loadLlmModelCatalog();
  const key = name.trim();
  if (getModelById(key)) {
    return key;
  }
  const aliased = catalog.aliases?.[key] ?? catalog.aliases?.[key.toLowerCase()];
  return aliased;
}

export function getNativeModelFlag(modelIdOrAlias: string): string | undefined {
  const catalogId = resolveCatalogAlias(modelIdOrAlias) ?? modelIdOrAlias;
  const entry = getModelById(catalogId);
  if (!entry) {
    return undefined;
  }
  return entry.transport.nativeModelFlag ?? entry.id;
}

export function resolvePresetCatalogModelId(
  adapterId: AdapterId,
  preset: InferencePreset
): string {
  const matrix = loadAdapterPresetMatrix();
  const catalogId = matrix.adapters[adapterId]?.[preset];
  if (!catalogId) {
    throw new Error(`No preset matrix entry for adapter ${adapterId}/${preset}`);
  }
  if (!getModelById(catalogId)) {
    throw new Error(`Preset matrix ${adapterId}/${preset} → ${catalogId} not found in catalog`);
  }
  return catalogId;
}

export function resolvePresetNativeModel(adapterId: AdapterId, preset: InferencePreset): string {
  const catalogId = resolvePresetCatalogModelId(adapterId, preset);
  const flag = getNativeModelFlag(catalogId);
  if (!flag) {
    throw new Error(`Catalog entry ${catalogId} has no transport.nativeModelFlag`);
  }
  return flag;
}

export function resolveModelThroughCatalog(
  _adapterId: AdapterId,
  modelOrAlias: string
): string {
  const fromCatalog = getNativeModelFlag(modelOrAlias);
  if (fromCatalog) {
    return fromCatalog;
  }
  return modelOrAlias;
}

export function listCatalogModelIds(): string[] {
  return loadLlmModelCatalog().models.map((entry) => entry.id);
}

export function listMatrixCatalogIds(): string[] {
  const matrix = loadAdapterPresetMatrix();
  const ids = new Set<string>();
  for (const adapterId of Object.keys(matrix.adapters)) {
    for (const preset of PRESETS) {
      ids.add(matrix.adapters[adapterId][preset]);
    }
  }
  return [...ids];
}

/** Validates constitution peer adapters exist in matrix with full preset coverage. */
export function assertConstitutionPeerMatrixComplete(): void {
  const matrix = loadAdapterPresetMatrix();
  for (const adapterId of listConstitutionPeerAdapterIds()) {
    const presets = matrix.adapters[adapterId];
    if (!presets) {
      throw new Error(`Constitution peer adapter missing from matrix: ${adapterId}`);
    }
    for (const preset of PRESETS) {
      if (!presets[preset]) {
        throw new Error(`Constitution peer ${adapterId} missing preset: ${preset}`);
      }
    }
  }
}

/** ProviderId is today's peer adapter subset; matrix keys use AdapterId. */
export function resolvePresetNativeModelForProvider(
  provider: ProviderId,
  preset: InferencePreset
): string {
  return resolvePresetNativeModel(provider, preset);
}
