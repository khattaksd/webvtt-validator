import { mkdir, writeFile } from 'node:fs/promises';

const outDir = new URL('../dist/', import.meta.url);

await mkdir(outDir, { recursive: true });

const cjs = `"use strict";

// Best-effort CommonJS entrypoint.
// We re-export the CJS bundle produced by Vite.

module.exports = require("./index.cjs");
`;

await writeFile(new URL('index.js', outDir), cjs, 'utf8');
