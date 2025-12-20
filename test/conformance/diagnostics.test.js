import { describe, it, expect } from 'vitest';
import { parse, formatDiagnostics, DiagnosticCode, DiagnosticSeverity } from '../../src/index.js';

describe('Diagnostics and Options', () => {
  describe('Strict Mode', () => {
    it('should abort on invalid signature in strict mode (default)', () => {
      const input = 'WEBVT';
      const result = parse(input); // strict defaults to 'w3c'
      
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.SIGNATURE_TOO_SHORT);
      // Aborted means empty results
      expect(result.cues).toHaveLength(0);
    });

    it('should continue on invalid signature in best-effort mode', () => {
      const input = 'WEBVT\n\n00:00.000 --> 00:01.000\nCue';
      const result = parse(input, { strict: 'best-effort' });
      
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.SIGNATURE_INVALID);
      // Should have parsed the cue despite the signature error
      expect(result.cues).toHaveLength(1);
      expect(result.cues[0].text).toBe('Cue');
    });
  });

  describe('formatDiagnostics', () => {
    it('should format no errors message', () => {
      const output = formatDiagnostics([]);
      expect(output).toBe('No errors or warnings found.');
    });

    it('should format diagnostics list', () => {
      const diagnostics = [
        {
          severity: 'error',
          code: 123,
          message: 'Test Error',
          line: 1,
          col: 5
        },
        {
          severity: 'warning',
          code: 456,
          message: 'Test Warning',
          line: 10,
          col: 1
        }
      ];

      const output = formatDiagnostics(diagnostics);
      expect(output).toContain('[ERROR] Line 1:5 - Test Error (Code: 123)');
      expect(output).toContain('[WARNING] Line 10:1 - Test Warning (Code: 456)');
    });

    it('should truncate output if max is provided', () => {
      const diagnostics = [
        { severity: 'error', code: 1, message: 'Err 1', line: 1 },
        { severity: 'error', code: 2, message: 'Err 2', line: 2 },
        { severity: 'error', code: 3, message: 'Err 3', line: 3 },
      ];

      const output = formatDiagnostics(diagnostics, { max: 2 });
      expect(output).toContain('Err 1');
      expect(output).toContain('Err 2');
      expect(output).not.toContain('Err 3');
      expect(output).toContain('... and 1 more.');
    });
  });

  describe('Output Options', () => {
      it('should exclude cue text nodes if requested', () => {
          const input = `WEBVTT

00:00.000 --> 00:01.000
<b>Bold</b>`;
          const result = parse(input, { 
              output: { includeCueTextNodes: false } 
          });
          
          expect(result.cues).toHaveLength(1);
          expect(result.cues[0].tree).toBeNull(); // Tree should not be generated (null)
          expect(result.cues[0].text).toBe('<b>Bold</b>');
      });
  });
});
