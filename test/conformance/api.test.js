import { describe, it, expect } from 'vitest';
import { parse } from '../../src/index.ts';
import { constructDOM } from '../../src/parser/cue-text/dom-construction.ts';
import { NodeType } from '../../src/parser/cue-text/parse-nodes.ts';

describe('Public API', () => {
  it('should expose parse function', () => {
    expect(typeof parse).toBe('function');
  });

  it('should return expected structure', () => {
    const input = 'WEBVTT\n\n00:00.000 --> 00:01.000\ntest';
    const result = parse(input);
    
    expect(result).toHaveProperty('cues');
    expect(result).toHaveProperty('regions');
    expect(result).toHaveProperty('stylesheets');
    expect(result).toHaveProperty('diagnostics');
    expect(result).toHaveProperty('metadata');
  });

  it('should construct DOM from cue tree', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000
<b>Bold</b>`;
      const result = parse(input);
      const cue = result.cues[0];
      const dom = constructDOM(cue.tree);
      
      expect(dom.nodeType).toBe('DocumentFragment');
      expect(dom.children).toHaveLength(1);
      
      const b = dom.children[0];
      expect(b.tagName).toBe('b');
      expect(b.children[0].nodeType).toBe('Text');
      expect(b.children[0].textContent).toBe('Bold');
  });
});
