import { describe, it, expect } from 'vitest';
import { parseTimestamp } from '../../src/parser/timestamp.ts';

describe('parseTimestamp', () => {
  it('parses MM:SS.mmm', () => {
    expect(parseTimestamp('00:01.250')).toBe(1.25);
  });

  it('parses HH:MM:SS.mmm', () => {
    expect(parseTimestamp('01:00:00.000')).toBe(3600);
  });

  it('allows minutes > 59 in MM:SS.mmm', () => {
    expect(parseTimestamp('99:00.000')).toBe(5940);
  });

  it('rejects seconds > 59', () => {
    expect(parseTimestamp('00:60.000')).toBeNull();
  });

  it('rejects invalid formats', () => {
    expect(parseTimestamp('0:00.000')).toBeNull();
    expect(parseTimestamp('00:00')).toBeNull();
    expect(parseTimestamp('00:00.00')).toBeNull();
    expect(parseTimestamp('aa:bb.ccc')).toBeNull();
  });
});
