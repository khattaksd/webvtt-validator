import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// ESM consumer check
const esm = await import(new URL('../../dist/index.mjs', import.meta.url));
assert.equal(typeof esm.parse, 'function');

// CJS consumer check
const require = createRequire(import.meta.url);
const cjs = require('../../dist/index.cjs');
assert.equal(typeof cjs.parse, 'function');

// Runtime sanity: parse a tiny file
const input = 'WEBVTT\n\n00:00.000 --> 00:01.000\nHello';
const esmResult = esm.parse(input);
assert.equal(esmResult.cues.length, 1);

const cjsResult = cjs.parse(input);
assert.equal(cjsResult.cues.length, 1);

console.log('dist smoke test: OK');
