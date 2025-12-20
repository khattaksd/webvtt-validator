import { describe, it, expect } from 'vitest';
import { parse, NodeType } from '../../src/index.js';

describe('WebVTT Cue Text Parsing (§6.4)', () => {
  it('should parse plain text', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
Hello World`;
    const result = parse(input);
    const cue = result.cues[0];
    expect(cue.tree).toBeDefined();
    expect(cue.tree.children).toHaveLength(1);
    expect(cue.tree.children[0].type).toBe(NodeType.TEXT);
    expect(cue.tree.children[0].value).toBe('Hello World');
  });

  it('should parse simple tags', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
<b>Bold</b> and <i>Italic</i>`;
    const result = parse(input);
    const root = result.cues[0].tree;
    
    // Structure:
    // BOLD "Bold"
    // TEXT " and "
    // ITALIC "Italic"
    
    expect(root.children).toHaveLength(3);
    expect(root.children[0].type).toBe(NodeType.BOLD);
    expect(root.children[0].children[0].value).toBe('Bold');
    
    expect(root.children[1].type).toBe(NodeType.TEXT);
    expect(root.children[1].value).toBe(' and ');
    
    expect(root.children[2].type).toBe(NodeType.ITALIC);
    expect(root.children[2].children[0].value).toBe('Italic');
  });

  it('should parse class tags', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
<c.red.bold>Colored</c>`;
    const result = parse(input);
    const node = result.cues[0].tree.children[0];
    
    expect(node.type).toBe(NodeType.CLASS);
    expect(node.classes).toContain('red');
    expect(node.classes).toContain('bold');
    expect(node.children[0].value).toBe('Colored');
  });

  it('should parse voice tags', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
<v Narrator>Speech</v>`;
    const result = parse(input);
    const node = result.cues[0].tree.children[0];
    
    expect(node.type).toBe(NodeType.VOICE);
    expect(node.value).toBe('Narrator');
    expect(node.children[0].value).toBe('Speech');
  });

  it('should parse timestamps in text', () => {
    const input = `WEBVTT

00:00.000 --> 00:05.000
Start <00:02.500> Middle <00:04.000> End`;
    const result = parse(input);
    const children = result.cues[0].tree.children;
    
    expect(children).toHaveLength(5);
    expect(children[0].type).toBe(NodeType.TEXT); // Start
    expect(children[1].type).toBe(NodeType.TIMESTAMP); // <00:02.500>
    expect(children[1].value).toBe(2.5);
    expect(children[3].type).toBe(NodeType.TIMESTAMP); // <00:04.000>
    expect(children[3].value).toBe(4.0);
  });

  it('should handle nested tags', () => {
    const input = `WEBVTT

00:00.000 --> 00:01.000
<b><i>BoldItalic</i></b>`;
    const result = parse(input);
    const b = result.cues[0].tree.children[0];
    expect(b.type).toBe(NodeType.BOLD);
    
    const i = b.children[0];
    expect(i.type).toBe(NodeType.ITALIC);
    expect(i.children[0].value).toBe('BoldItalic');
  });
  
  it('should handle unclosed tags (implicit closing)', () => {
      const input = `WEBVTT

00:00.000 --> 00:01.000
<b>Bold`;
      const result = parse(input);
      const root = result.cues[0].tree;
      expect(root.children).toHaveLength(1);
      expect(root.children[0].type).toBe(NodeType.BOLD);
      expect(root.children[0].children[0].value).toBe('Bold');
  });
  
  it('should handle incorrectly nested tags', () => {
      // <b><i>Text</b></i> -> <b><i>Text</i></b> (Wait, parser logic closes i when b closes?)
      // Spec: "If the tag name is found... let current be the parent of the node"
      // So </b> should search stack for b. It finds b. b is parent of i.
      // So it closes i (implicitly) then closes b.
      // Then </i> sees nothing to close because i is already closed (popped).
      
      const input = `WEBVTT

00:00.000 --> 00:01.000
<b><i>Text</b></i>`;
      const result = parse(input);
      const root = result.cues[0].tree;
      
      // Expected:
      // BOLD
      //   ITALIC
      //     TEXT "Text"
      // (The trailing </i> is ignored)
      
      const b = root.children[0];
      expect(b.type).toBe(NodeType.BOLD);
      const i = b.children[0];
      expect(i.type).toBe(NodeType.ITALIC);
      expect(i.children[0].value).toBe('Text');
      
      // There should be no subsequent children of root
      expect(root.children).toHaveLength(1);
  });
});
