#!/usr/bin/env node
/**
 * F-1 — Validate config JSON files against JSON Schema (Contract Layer).
 * Usage: npm run validate:config
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  {
    label: 'llm-model-catalog.json',
    dataPath: join(root, 'config/llm-model-catalog.json'),
    schemaPath: join(root, 'config/schemas/llm-model-catalog.schema.json'),
  },
  {
    label: 'adapter-preset-matrix.json',
    dataPath: join(root, 'config/adapter-preset-matrix.json'),
    schemaPath: join(root, 'config/schemas/adapter-preset-matrix.schema.json'),
  },
];

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let failed = 0;

for (const target of targets) {
  const schema = JSON.parse(readFileSync(target.schemaPath, 'utf-8'));
  const data = JSON.parse(readFileSync(target.dataPath, 'utf-8'));
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (ok) {
    console.log(`OK  ${target.label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${target.label}`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('\nvalidate:config — all targets passed');
