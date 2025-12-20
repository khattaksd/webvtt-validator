import { NodeType } from './parse-nodes.js';

/**
 * Converts a WebVTT Node Tree (AST) into a simplified JSON-DOM representation
 * following the rules in §6.5.
 * 
 * This is "conceptual" DOM construction for non-browser environments.
 * 
 * @param {import('./parse-nodes.js').WebVTTNode} root
 * @returns {Object} JSON-DOM representation (DocumentFragment-like)
 */
export function constructDOM(root) {
  if (!root) return null;
  
  // Root is conceptually a DocumentFragment
  return {
    nodeType: 'DocumentFragment',
    children: root.children.map(convertNode).filter(Boolean)
  };
}

function convertNode(node) {
  switch (node.type) {
    case NodeType.TEXT:
      return {
        nodeType: 'Text',
        textContent: node.value
      };
      
    case NodeType.TIMESTAMP:
      // Spec says ProcessingInstruction "timestamp"
      return {
        nodeType: 'ProcessingInstruction',
        target: 'timestamp',
        data: node.value // seconds
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
            title: node.value
        });
      }
      
    case NodeType.LANG:
      {
        // Lang maps to span with lang attribute
        return createElement('span', node.children, {
            class: node.classes.join(' '),
            lang: node.value
        });
      }
      
    default:
      return null;
  }
}

function createElement(tagName, children, attributes = {}) {
  // Filter out empty class attributes
  if (attributes.class === '') delete attributes.class;
  
  return {
    nodeType: 'Element',
    tagName,
    attributes,
    children: children.map(convertNode).filter(Boolean)
  };
}
