import { describe, it, expect } from 'vitest';
import { validateSignature } from '../../src/parser/signature.ts';
import { DiagnosticCode, DiagnosticSeverity } from '../../src/parser/diagnostics.ts';

describe('validateSignature', () => {
  it('flags too-short input', () => {
    const diags = validateSignature('WEBVT');
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe(DiagnosticSeverity.Error);
    expect(diags[0].code).toBe(DiagnosticCode.SIGNATURE_TOO_SHORT);
  });

  it('flags invalid signature text', () => {
    const diags = validateSignature('WEBVTx');
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe(DiagnosticCode.SIGNATURE_INVALID);
  });

  it('flags invalid character after WEBVTT', () => {
    const diags = validateSignature('WEBVTT-\n\n');
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe(DiagnosticCode.SIGNATURE_INVALID);
  });

  it('accepts WEBVTT followed by LF', () => {
    const diags = validateSignature('WEBVTT\n\n');
    expect(diags).toHaveLength(0);
  });
});
