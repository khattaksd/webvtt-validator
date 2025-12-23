import { describe, it, expect } from 'vitest';
import { normalizeInput } from '../../src/parser/normalization.ts';

describe('normalizeInput', () => {
  it('replaces NULL with U+FFFD', () => {
    expect(normalizeInput('a\u0000b')).toBe('a\uFFFDb');
  });

  it('normalizes CRLF to LF', () => {
    expect(normalizeInput('a\r\nb')).toBe('a\nb');
  });

  it('normalizes CR to LF', () => {
    expect(normalizeInput('a\rb')).toBe('a\nb');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeInput('')).toBe('');
  });
});
