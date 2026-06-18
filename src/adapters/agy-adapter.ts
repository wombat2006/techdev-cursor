import { executeAgyPrint } from '../utils/antigravity-cli';
import type { AdapterRequest, AdapterResult, ProviderAdapter } from '../types/adapter-types';
import { buildFullPrompt } from './inference-profile-resolver';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export class AgyAdapter implements ProviderAdapter {
  readonly providerId = 'agy' as const;

  async invoke(request: AdapterRequest): Promise<AdapterResult> {
    const start = Date.now();
    const model = request.profile.model ?? DEFAULT_MODEL;
    const fullPrompt = buildFullPrompt(request.prompt, request.context, request.profile.cot);
    const cwd = request.workingDirectory ?? process.cwd();

    try {
      const { content, stderr } = await executeAgyPrint(fullPrompt, { model, cwd });
      if (stderr) {
        // Non-fatal diagnostic output from agy
      }
      return {
        success: true,
        content,
        executionTimeMs: Date.now() - start,
        provider: this.providerId,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - start,
        provider: this.providerId,
        model,
      };
    }
  }
}

export const agyAdapter = new AgyAdapter();
