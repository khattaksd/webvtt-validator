import { describe, it, expect } from 'vitest';
import { Cue, Region } from '../../src/parser/model.ts';
import { parseCueSettings } from '../../src/parser/cue-settings.ts';

describe('parseCueSettings', () => {
  it('links region by last matching id', () => {
    const cue = new Cue();
    const r1 = new Region();
    r1.id = 'a';
    const r2 = new Region();
    r2.id = 'a';
    parseCueSettings('region:a', cue, [r1, r2]);
    expect(cue.region).toBe(r2);
  });

  it('vertical sets cue.vertical and clears region', () => {
    const cue = new Cue();
    const r = new Region();
    r.id = 'x';
    cue.region = r;
    parseCueSettings('vertical:rl', cue, [r]);
    expect(cue.vertical).toBe('rl');
    expect(cue.region).toBeNull();
  });

  it('line percent sets snapToLines=false and clears region', () => {
    const cue = new Cue();
    const r = new Region();
    r.id = 'x';
    cue.region = r;
    parseCueSettings('line:50%', cue, [r]);
    expect(cue.line).toBe(50);
    expect(cue.snapToLines).toBe(false);
    expect(cue.region).toBeNull();
  });

  it('line number sets snapToLines=true and parses lineAlign', () => {
    const cue = new Cue();
    parseCueSettings('line:5,center', cue, []);
    expect(cue.line).toBe(5);
    expect(cue.snapToLines).toBe(true);
    expect(cue.lineAlign).toBe('center');
  });

  it('position parses percent and optional align', () => {
    const cue = new Cue();
    parseCueSettings('position:10%,line-right', cue, []);
    expect(cue.position).toBe(10);
    expect(cue.positionAlign).toBe('line-right');
  });

  it('size parses percent and clears region when not 100', () => {
    const cue = new Cue();
    const r = new Region();
    r.id = 'x';
    cue.region = r;
    parseCueSettings('size:50%', cue, [r]);
    expect(cue.size).toBe(50);
    expect(cue.region).toBeNull();
  });

  it('align parses allowed values', () => {
    const cue = new Cue();
    parseCueSettings('align:start', cue, []);
    expect(cue.align).toBe('start');
  });

  it('ignores unknown/invalid settings without throwing', () => {
    const cue = new Cue();
    expect(() => parseCueSettings('foo:bar line:% position:x% size:abc% align:nope', cue, [])).not.toThrow();
  });
});
