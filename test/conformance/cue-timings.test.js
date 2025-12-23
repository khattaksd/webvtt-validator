import { describe, it, expect } from 'vitest';
import { parse } from '../../src/index.ts';
import { DiagnosticCode } from '../../src/parser/diagnostics.ts';

describe('WebVTT Cue Timings and Settings (§6.3)', () => {
  describe('Timestamps', () => {
    it('should parse MM:SS.mmm format', () => {
      const input = `WEBVTT

00:00.500 --> 00:01.000
Test`;
      const result = parse(input);
      expect(result.cues[0].startTime).toBe(0.5);
      expect(result.cues[0].endTime).toBe(1.0);
    });

    it('should parse HH:MM:SS.mmm format', () => {
      const input = `WEBVTT

01:00:00.000 --> 01:00:01.000
Test`;
      const result = parse(input);
      expect(result.cues[0].startTime).toBe(3600);
      expect(result.cues[0].endTime).toBe(3601);
    });

    it('should reject invalid timestamp format', () => {
      const input = `WEBVTT

00:00 --> 00:01
Test`;
      const result = parse(input);
      expect(result.diagnostics).toContainEqual(expect.objectContaining({
        code: DiagnosticCode.TIMESTAMP_INVALID
      }));
    });

    it('should reject start > end', () => {
      const input = `WEBVTT

00:02.000 --> 00:01.000
Test`;
      const result = parse(input);
      expect(result.diagnostics).toContainEqual(expect.objectContaining({
        code: DiagnosticCode.CUE_TIMING_INVALID_ORDER
      }));
    });
  });

  describe('Settings', () => {
    it('should parse vertical setting', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 vertical:rl
Test`;
      const result = parse(input);
      expect(result.cues[0].vertical).toBe('rl');
    });

    it('should parse line setting (percent)', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 line:50%
Test`;
      const result = parse(input);
      expect(result.cues[0].line).toBe(50);
      expect(result.cues[0].snapToLines).toBe(false);
    });

    it('should parse line setting (number)', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 line:5
Test`;
      const result = parse(input);
      expect(result.cues[0].line).toBe(5);
      expect(result.cues[0].snapToLines).toBe(true);
    });

    it('should parse line setting with alignment', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 line:5,center
Test`;
      const result = parse(input);
      expect(result.cues[0].line).toBe(5);
      expect(result.cues[0].lineAlign).toBe('center');
    });

    it('should parse position setting', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 position:10%,line-right
Test`;
      const result = parse(input);
      expect(result.cues[0].position).toBe(10);
      expect(result.cues[0].positionAlign).toBe('line-right');
    });

    it('should parse size setting', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 size:50%
Test`;
      const result = parse(input);
      expect(result.cues[0].size).toBe(50);
    });

    it('should parse align setting', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000 align:start
Test`;
      const result = parse(input);
      expect(result.cues[0].align).toBe('start');
    });

    it('should link region', () => {
      const input = `WEBVTT

REGION
id:test width:50%

00:00.000 --> 00:01.000 region:test
Test`;
      const result = parse(input);
      expect(result.cues[0].region).toBeDefined();
      expect(result.cues[0].region.id).toBe('test');
    });
  });
});
