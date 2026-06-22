import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');

function loadSchema(relativePath: string) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf-8'));
}

describe('CLI metadata wire schemas (TS-26)', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const codexEventSchema = loadSchema('config/schemas/cli-metadata/codex-cli-event.schema.json');
  const validateCodexEvent = ajv.compile(codexEventSchema);

  const normalizedSchema = loadSchema('config/schemas/provider-invoke-metadata.schema.json');
  const validateNormalized = ajv.compile(normalizedSchema);

  it('validates recorded Codex JSONL fixture events', () => {
    const events = JSON.parse(
      readFileSync(
        join(root, 'config/fixtures/cli-metadata/codex-exec-success.events.json'),
        'utf-8'
      )
    ) as unknown[];
    for (const event of events) {
      expect(validateCodexEvent(event)).toBe(true);
    }
  });

  it('accepts normalized metadata mapped from Codex turn.completed', () => {
    const mapped = {
      resolvedModel: 'codex-default',
      sessionId: '019eef89-0d20-7023-be51-bef6911205b2',
      usage: {
        inputTokens: 14853,
        outputTokens: 20,
        cacheReadTokens: 4992,
        reasoningOutputTokens: 13,
      },
      provisional: false,
    };
    expect(validateNormalized(mapped)).toBe(true);
  });
});
