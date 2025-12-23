import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { parse, DiagnosticSeverity } from '../../src/index.ts';

describe('Samples harness', () => {
  it('validates all samples from manifest', async () => {
    const samplesRoot = new URL('../../demo/samples/', import.meta.url);
    const manifestUrl = new URL('./manifest.json', samplesRoot);

    const manifestText = await readFile(manifestUrl, 'utf8');
    const manifest = JSON.parse(manifestText);

    const groups = Array.isArray(manifest?.groups) ? manifest.groups : [];
    expect(groups.length).toBeGreaterThan(0);

    const failures = [];

    for (const group of groups) {
      const label = String(group?.label ?? '');
      const normalizedLabel = label.trim().toLowerCase();
      const isInvalidGroup = normalizedLabel === 'invalid' || normalizedLabel.startsWith('invalid');
      const isValidGroup = normalizedLabel === 'valid' || normalizedLabel.startsWith('valid');

      const items = Array.isArray(group?.items) ? group.items : [];
      for (const item of items) {
        const id = String(item?.id ?? '');
        const relPath = String(item?.path ?? '');

        if (!relPath) {
          failures.push(`${id || '(unknown)'}: missing path`);
          continue;
        }

        const sampleUrl = new URL(relPath.replace(/^samples\//, ''), samplesRoot);
        const input = await readFile(sampleUrl, 'utf8');
        const result = parse(input);

        if (isValidGroup) {
          if (result.diagnostics.length !== 0) {
            failures.push(`${id}: expected 0 diagnostics, got ${result.diagnostics.length}`);
          }
        } else if (isInvalidGroup) {
          const hasError = result.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
          if (!hasError) {
            failures.push(`${id}: expected at least one error diagnostic, got ${result.diagnostics.length}`);
          }
        } else {
          failures.push(`${id}: unknown manifest group label ${JSON.stringify(label)}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
