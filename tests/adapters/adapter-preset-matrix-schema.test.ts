import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('adapter-preset-matrix schema (open map)', () => {
  const root = join(__dirname, '..', '..');
  const schema = JSON.parse(
    readFileSync(join(root, 'config/schemas/adapter-preset-matrix.schema.json'), 'utf-8')
  );
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  it('accepts hypothetical native adapter rows without schema migration', () => {
    const sample = {
      version: '1',
      constitutionPeerAdapters: ['claude', 'codex', 'agy'],
      adapters: {
        claude: {
          fast: 'claude-haiku-4-5',
          balanced: 'claude-sonnet-4-6',
          deep: 'claude-sonnet-4-6',
          critical: 'claude-opus-4-6',
        },
        qwen_native: {
          fast: 'qwen-stub-fast',
          balanced: 'qwen-stub-balanced',
          deep: 'qwen-stub-deep',
          critical: 'qwen-stub-critical',
        },
        openrouter: {
          fast: 'or-stub-fast',
          balanced: 'or-stub-balanced',
          deep: 'or-stub-deep',
          critical: 'or-stub-critical',
        },
      },
    };
    expect(validate(sample)).toBe(true);
  });
});
