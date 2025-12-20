import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

function parseLimitBytes(envKey, fallbackBytes) {
  const raw = process.env[envKey];
  if (!raw) return fallbackBytes;

  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(
      `Invalid ${envKey}=${JSON.stringify(raw)}; expected non-negative number of bytes`
    );
  }
  return n;
}

async function measureFileBytes(fileUrl) {
  const buf = await readFile(fileUrl);
  return {
    rawBytes: buf.byteLength,
    gzipBytes: gzipSync(buf, { level: 9 }).byteLength,
  };
}

function formatBytes(n) {
  return `${n}B`;
}

export function bundleSizeGuard(opts) {
  const {
    checks,
    envPrefix = 'SIZE_LIMIT_',
    failOn = 'error',
  } = opts;

  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error('bundleSizeGuard: opts.checks must be a non-empty array');
  }

  let outDirUrl;

  return {
    name: 'bundle-size-guard',
    apply: 'build',

    configResolved(config) {
      const outDirPath = path.resolve(config.root, config.build.outDir);
      outDirUrl = new URL(pathToFileURL(outDirPath).href.replace(/\/+$/, '') + '/');
    },

    async closeBundle() {
      const baseUrl = outDirUrl ?? new URL('../dist/', import.meta.url);

      const results = [];
      const failures = [];

      for (const c of checks) {
        const rawEnv = `${envPrefix}${c.id}_RAW`;
        const gzipEnv = `${envPrefix}${c.id}_GZIP`;

        const rawLimit = parseLimitBytes(rawEnv, c.rawLimit);
        const gzipLimit = parseLimitBytes(gzipEnv, c.gzipLimit);

        const url = new URL(c.file, baseUrl);
        const { rawBytes, gzipBytes } = await measureFileBytes(url);

        results.push({
          id: c.id,
          file: c.file,
          rawBytes,
          gzipBytes,
          rawLimit,
          gzipLimit,
          rawEnv,
          gzipEnv,
        });

        if (rawBytes > rawLimit) {
          failures.push({ file: c.file, kind: 'raw', actual: rawBytes, limit: rawLimit });
        }
        if (gzipBytes > gzipLimit) {
          failures.push({ file: c.file, kind: 'gzip', actual: gzipBytes, limit: gzipLimit });
        }
      }

      const lines = [];
      lines.push('Bundle size guard');

      for (const r of results) {
        lines.push(
          `- ${r.file}: ${formatBytes(r.rawBytes)} raw (limit ${formatBytes(r.rawLimit)} via ${r.rawEnv}), ` +
          `${formatBytes(r.gzipBytes)} gzip (limit ${formatBytes(r.gzipLimit)} via ${r.gzipEnv})`
        );
      }

      if (failures.length === 0) {
        console.log(lines.join('\n'));
        return;
      }

      const failLines = [];
      failLines.push('Bundle size guard: FAILED');
      for (const f of failures) {
        failLines.push(`- ${f.file} ${f.kind} exceeded: ${formatBytes(f.actual)} > ${formatBytes(f.limit)}`);
      }
      failLines.push('');
      failLines.push('Current bundle sizes / limits:');
      failLines.push(...lines.slice(1));

      const msg = failLines.join('\n');

      if (failOn === 'warn') {
        console.warn(`\n${msg}\n`);
        return;
      }

      console.error(`\n${msg}\n`);
      process.exitCode = 1;
    },
  };
}
