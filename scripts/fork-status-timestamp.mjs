#!/usr/bin/env node
/**
 * Print FORK_STATUS milestone timestamps in Asia/Tokyo (JST).
 *
 * Usage:
 *   node scripts/fork-status-timestamp.mjs              # now
 *   node scripts/fork-status-timestamp.mjs HEAD         # HEAD commit author date
 *   node scripts/fork-status-timestamp.mjs e7a6ac2b     # specific commit
 *
 * Policy: docs/DOCUMENTATION_POLICY.md — milestone rows must not use invented times.
 */

import { execFileSync } from 'node:child_process';

const JST = 'Asia/Tokyo';
const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: JST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatJst(date) {
  const parts = Object.fromEntries(
    FORMAT.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second} JST`;
}

function commitDate(ref) {
  const iso = execFileSync('git', ['show', '-s', '--format=%cI', ref], {
    encoding: 'utf8',
  }).trim();
  if (!iso) {
    throw new Error(`Could not resolve git ref: ${ref}`);
  }
  return new Date(iso);
}

const ref = process.argv[2];
const date = ref ? commitDate(ref) : new Date();
process.stdout.write(`${formatJst(date)}\n`);
