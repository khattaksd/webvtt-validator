import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// This is a best-effort browser compatibility check.
// We verify the published ESM build doesn't include obvious Node-only imports/usages,
// and that it can be imported as standard ESM.

const distEsmUrl = new URL('../../dist/index.mjs', import.meta.url);
const distEsmPath = distEsmUrl.pathname;

const code = await readFile(distEsmUrl, 'utf8');

const forbiddenSubstrings = [
  'node:fs',
  'node:path',
  'node:url',
  'node:crypto',
  'node:stream',
  'node:process',
  'node:module',
  'require(',
  'process.',
  'Buffer',
  '__dirname',
  '__filename',
];

for (const s of forbiddenSubstrings) {
  assert.ok(
    !code.includes(s),
    `dist/index.mjs appears to include Node-only reference: ${JSON.stringify(s)} (in ${distEsmPath})`
  );
}

const esm = await import(distEsmUrl);
assert.equal(typeof esm.parse, 'function');

const input = 'WEBVTT\n\n00:00.000 --> 00:01.000\nHello';
const result = esm.parse(input);
assert.equal(result.cues.length, 1);

console.log('browser smoke test: OK');
