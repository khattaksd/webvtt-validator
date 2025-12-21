import { NodeType, WebVTTNode } from './parse-nodes.ts';

export interface DOMNode {
  nodeType: string;
  textContent?: string;
  target?: string;
  data?: number;
  tagName?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
}

/**
 * Converts a WebVTT Node Tree (AST) into a simplified JSON-DOM representation
 * following the rules in §6.5.
 * 
 * This is "conceptual" DOM construction for non-browser environments.
 */
export function constructDOM(root: WebVTTNode): DOMNode | null {
  if (!root) return null;
  
  // Root is conceptually a DocumentFragment
  return {
    nodeType: 'DocumentFragment',
    children: root.children.map(convertNode).filter(Boolean)
  };
}

function convertNode(node: WebVTTNode): DOMNode | null {
  switch (node.type) {
    case NodeType.TEXT:
      return {
        nodeType: 'Text',
        textContent: node.value as string
      };
      
    case NodeType.TIMESTAMP:
      // Spec says ProcessingInstruction "timestamp"
      return {
        nodeType: 'ProcessingInstruction',
        target: 'timestamp',
        data: node.value as number
      };
      
    case NodeType.CLASS:
      return createElement('span', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.ITALIC:
      return createElement('i', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.BOLD:
      return createElement('b', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.UNDERLINE:
      return createElement('u', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.RUBY:
      return createElement('ruby', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.RUBY_TEXT:
      return createElement('rt', node.children, {
        class: node.classes.join(' ')
      });
      
    case NodeType.VOICE:
      {
        // Voice map to span with title and class "voice" (plus other classes)
        const classes = ['voice', ...node.classes].filter(Boolean).join(' ');
        return createElement('span', node.children, {
            class: classes,
            title: node.value as string
        });
      }
      
    case NodeType.LANG:
      {
        // Lang maps to span with lang attribute
        return createElement('span', node.children, {
            class: node.classes.join(' '),
            lang: node.value as string
        });
      }
      
    default:
      return null;
  }
}

function createElement(tagName: string, children: WebVTTNode[], attributes: Record<string, string> = {}): DOMNode {
  // Filter out empty class attributes
  if (attributes.class === '') delete attributes.class;
  
  return {
    nodeType: 'Element',
    tagName,
    attributes,
    children: children.map(convertNode).filter(Boolean)
  };
}
