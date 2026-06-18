#!/usr/bin/env node
/**
 * G7 adapter-path smoke — same invoke chain as techsapo-providers MCP (without Cursor UI).
 * Run after npm run build: node scripts/g7-adapter-smoke.js
 */

const { claudeAdapter } = require('../dist/adapters/claude-adapter');
const { codexAdapter } = require('../dist/adapters/codex-adapter');
const { agyAdapter } = require('../dist/adapters/agy-adapter');
const { resolveInferenceProfile } = require('../dist/adapters/inference-profile-resolver');

const CASES = [
  {
    name: 'analyze_claude',
    adapter: claudeAdapter,
    provider: 'claude',
    input: {
      prompt: 'Reply with exactly one word: ok',
      preset: 'fast',
      model: 'haiku',
    },
  },
  {
    name: 'analyze_codex',
    adapter: codexAdapter,
    provider: 'codex',
    input: {
      prompt: 'Reply with exactly one word: ok',
      preset: 'fast',
      model: 'gpt-5.5',
    },
  },
  {
    name: 'analyze_agy',
    adapter: agyAdapter,
    provider: 'agy',
    input: {
      prompt: 'You are text-only. Reply with exactly one word: ok',
      preset: 'fast',
      model: 'gemini-2.5-flash',
    },
    workingDirectory: '/tmp',
  },
];

async function main() {
  let failed = 0;
  for (const testCase of CASES) {
    const profile = resolveInferenceProfile(testCase.provider, testCase.input);
    process.stdout.write(`${testCase.name} ... `);
    const result = await testCase.adapter.invoke({
      prompt: testCase.input.prompt,
      profile,
      workingDirectory: testCase.workingDirectory ?? process.cwd(),
    });
    const ok = result.success && result.content && /\bok\b/i.test(result.content);
    if (ok) {
      console.log(`OK (${result.executionTimeMs}ms)`);
    } else {
      failed += 1;
      console.log('FAIL');
      console.log(JSON.stringify(result, null, 2));
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
