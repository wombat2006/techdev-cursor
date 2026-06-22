import { logger } from '../../utils/logger';
import { config } from '../../config/environment';
import { executeAgyPrint } from '../../utils/antigravity-cli';
import type { LLMResponse, StreamEmit } from './types';

export async function executeGeminiCLI(
  emit: StreamEmit,
  prompt: string,
  version: '2.5-pro' | '2.5-flash'
): Promise<LLMResponse> {
  try {
    const modelName = version === '2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const providerKey = version === '2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    logger.info('Antigravity CLI execution (stdin + --print)', {
      command: 'agy',
      model: modelName,
      promptPreview: prompt.substring(0, 500),
    });

    const timeoutMs = config.wallBounce.enableTimeout ? config.wallBounce.timeoutMs : undefined;
    const { content, stderr } = await executeAgyPrint(prompt, {
      model: modelName,
      timeoutMs,
      onChunk: (chunk) => {
        emit('provider:streaming', {
          provider: providerKey,
          chunk,
          timestamp: Date.now(),
        });
      },
    });

    if (stderr) {
      logger.warn('Antigravity CLI stderr', { stderr });
    }

    const displayLabel =
      version === '2.5-pro' ? 'Gemini 2.5 Pro (Antigravity)' : 'Gemini 2.5 Flash (Antigravity)';
    const cost = version === '2.5-pro' ? 0.002 : 0.001;

    return {
      content: `[${displayLabel}] ${content}`,
      confidence: 0.88,
      reasoning: `Google ${displayLabel} via Antigravity CLI`,
      cost,
      tokens: { input: Math.ceil(prompt.length / 4), output: Math.ceil(content.length / 4) },
    };
  } catch (error) {
    logger.error('Antigravity CLI execution failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    throw new Error(
      `Antigravity CLI failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function invokeGemini(
  emit: StreamEmit,
  prompt: string,
  version: '2.5-pro' | '2.5-flash'
): Promise<LLMResponse> {
  return executeGeminiCLI(emit, prompt, version);
}

export async function invokeGeminiFlash(emit: StreamEmit, prompt: string): Promise<LLMResponse> {
  return executeGeminiCLI(emit, prompt, '2.5-flash');
}
