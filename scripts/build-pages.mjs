import { cp, mkdir, rm } from 'node:fs/promises';

const rootDir = new URL('../', import.meta.url);
const distDir = new URL('../dist/', import.meta.url);
const demoDir = new URL('../demo/', import.meta.url);
const pagesDir = new URL('../pages/', import.meta.url);

await rm(pagesDir, { recursive: true, force: true });
await mkdir(pagesDir, { recursive: true });

// Copy demo -> pages/
await cp(demoDir, pagesDir, { recursive: true });

// Copy dist -> pages/dist/
await cp(distDir, new URL('./dist/', pagesDir), { recursive: true });

// Copy some repo metadata (optional but handy when browsing Pages artifacts)
await cp(new URL('README.md', rootDir), new URL('README.md', pagesDir));

console.log('pages build: OK (output: pages/)');
