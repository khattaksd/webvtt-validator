import { describe, it, expect } from 'vitest';
import { parse } from '../../src/index.ts';
import { DiagnosticCode, DiagnosticSeverity } from '../../src/parser/diagnostics.ts';

describe('WebVTT File Parsing (§6.1)', () => {
  describe('Signature', () => {
    it('should accept valid signature "WEBVTT"', () => {
      const input = 'WEBVTT\n\n00:00.000 --> 00:01.000\ntest';
      const result = parse(input);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.cues).toHaveLength(1);
    });

    it('should accept valid signature with space', () => {
      const input = 'WEBVTT \n\n00:00.000 --> 00:01.000\ntest';
      const result = parse(input);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should accept valid signature with tab', () => {
      const input = 'WEBVTT\t\n\n00:00.000 --> 00:01.000\ntest';
      const result = parse(input);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('should reject short input', () => {
      const result = parse('WEBVT');
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.SIGNATURE_TOO_SHORT);
    });

    it('should reject invalid signature text', () => {
      const result = parse('WEBVTTx');
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.SIGNATURE_INVALID);
    });

    it('should reject invalid separator', () => {
      const result = parse('WEBVTT-');
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.SIGNATURE_INVALID);
    });
  });

  describe('Block Parsing', () => {
    it('should parse multiple cues separated by blank lines', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000
Cue 1

00:02.000 --> 00:03.000
Cue 2`;
      const result = parse(input);
      expect(result.cues).toHaveLength(2);
      expect(result.cues[0].text).toBe('Cue 1');
      expect(result.cues[1].text).toBe('Cue 2');
    });

    it('should ignore header metadata', () => {
      const input = `WEBVTT
Title: Test
Author: Me

00:00.000 --> 00:01.000
Test`;
      const result = parse(input);
      expect(result.cues).toHaveLength(1);
      expect(result.cues[0].text).toBe('Test');
    });

    it('should parse STYLE blocks', () => {
      const input = `WEBVTT

STYLE
::cue {
  color: red;
}

00:00.000 --> 00:01.000
Test`;
      const result = parse(input);
      expect(result.stylesheets).toHaveLength(1);
      expect(result.stylesheets[0].cssText).toContain('color: red');
      expect(result.cues).toHaveLength(1);
    });

    it('should parse REGION blocks', () => {
      const input = `WEBVTT

REGION
id:test width:50%

00:00.000 --> 00:01.000
Test`;
      const result = parse(input);
      expect(result.regions).toHaveLength(1);
      expect(result.regions[0].id).toBe('test');
      expect(result.regions[0].width).toBe(50);
    });
  });
});
