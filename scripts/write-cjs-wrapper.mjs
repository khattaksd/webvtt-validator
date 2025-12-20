import { mkdir, writeFile } from 'node:fs/promises';

const outDir = new URL('../dist/', import.meta.url);

await mkdir(outDir, { recursive: true });

const cjs = `"use strict";

// Best-effort CommonJS entrypoint.
// We re-export the UMD bundle (which already supports CommonJS environments).

module.exports = require("./webvtt-validator.umd.js");
`;

await writeFile(new URL('index.cjs', outDir), cjs, 'utf8');
