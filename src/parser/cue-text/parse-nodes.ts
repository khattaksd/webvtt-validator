import { CueTextTokenizer, TokenType } from './tokenizer';
import { parseTimestamp } from '../timestamp';

/**
 * Node types for the cue text DOM.
 */
export const NodeType = {
  ROOT: 'root',
  TEXT: 'text',
  TIMESTAMP: 'timestamp',
  CLASS: 'c',
  ITALIC: 'i',
  BOLD: 'b',
  UNDERLINE: 'u',
  RUBY: 'ruby',
  RUBY_TEXT: 'rt',
  VOICE: 'v',
  LANG: 'lang',
};

export class WebVTTNode {
  type: string;
  parent: WebVTTNode | null;
  children: WebVTTNode[];
  value: string | number;
  classes: string[];
  annotation: string;

  constructor(type: string, parent: WebVTTNode | null = null) {
    this.type = type;
    this.parent = parent;
    this.children = [];
    this.value = '';
    this.classes = [];
    this.annotation = '';
  }
  
  appendChild(node: WebVTTNode): void {
      node.parent = this;
      this.children.push(node);
  }
}

/**
 * Parses cue text into a node tree.
 * @param {string} input
 * @returns {WebVTTNode} Root node
 */
export function parseCueText(input: string): WebVTTNode {
  const tokenizer = new CueTextTokenizer(input);
  const root = new WebVTTNode(NodeType.ROOT);
  let current = root;
  
  // Language stack (for lang tags)
  // Not strictly implemented as separate stack, we use the tree structure.
  
  let token;
  while ((token = tokenizer.nextToken())) {
    switch (token.type) {
        case TokenType.STRING:
            {
                const node = new WebVTTNode(NodeType.TEXT);
                node.value = token.value;
                current.appendChild(node);
            }
            break;
            
        case TokenType.TIMESTAMP_TAG:
            {
                const timestamp = parseTimestamp(token.value);
                if (timestamp !== null) {
                    const node = new WebVTTNode(NodeType.TIMESTAMP);
                    node.value = timestamp;
                    current.appendChild(node);
                }
            }
            break;
            
        case TokenType.START_TAG:
            {
                const tagName = token.tagName;
                let newNode = null;
                
                // Map tag name to node type
                switch (tagName) {
                    case 'c':
                        newNode = new WebVTTNode(NodeType.CLASS);
                        break;
                    case 'i':
                        newNode = new WebVTTNode(NodeType.ITALIC);
                        break;
                    case 'b':
                        newNode = new WebVTTNode(NodeType.BOLD);
                        break;
                    case 'u':
                        newNode = new WebVTTNode(NodeType.UNDERLINE);
                        break;
                    case 'ruby':
                        newNode = new WebVTTNode(NodeType.RUBY);
                        break;
                    case 'rt':
                        newNode = new WebVTTNode(NodeType.RUBY_TEXT);
                        break;
                    case 'v':
                        newNode = new WebVTTNode(NodeType.VOICE);
                        newNode.value = token.annotation || ''; // Voice name
                        break;
                    case 'lang':
                        newNode = new WebVTTNode(NodeType.LANG);
                        newNode.value = token.annotation || ''; // Language tag
                        break;
                    default:
                        // Unknown tag - ignore start tag, process contents as children of current
                        // Spec says: "If the tag name is none of the above... ignore the token."
                        // So we do nothing, effectively treating it as if the tag wasn't there.
                        // (Note: Content inside IS processed, just not wrapped in a new node)
                        continue; 
                }
                
                if (newNode) {
                    // Add classes
                    newNode.classes = token.classes || [];
                    
                    // Special handling for Ruby Text:
                    // "If the tag name is 'rt' and current is a ruby object: Attach WebVTT Ruby Text Object"
                    // "Otherwise: ignore the token" (content becomes children of current)
                    if (tagName === 'rt') {
                        if (current.type === NodeType.RUBY) {
                            current.appendChild(newNode);
                            current = newNode;
                        } else {
                            // Ignored (but content processed)
                            // We don't change current.
                            continue;
                        }
                    } else {
                        current.appendChild(newNode);
                        current = newNode;
                    }
                }
            }
            break;
            
        case TokenType.END_TAG:
            {
                const tagName = token.tagName;
                
                // Spec §6.4:
                // If tag name is one of c, i, b, u, ruby, rt, v, lang...
                // 1. If current node is root, ignore.
                // 2. Loop up the stack:
                //    If node matches tag type, pop stack up to that node.
                //    Else, ignore.
                // Actually simplified: "If current node type matches, pop. Else if parent matches, pop..."
                
                // Map tag name to node type to check match
                let expectedType = null;
                switch (tagName) {
                    case 'c': expectedType = NodeType.CLASS; break;
                    case 'i': expectedType = NodeType.ITALIC; break;
                    case 'b': expectedType = NodeType.BOLD; break;
                    case 'u': expectedType = NodeType.UNDERLINE; break;
                    case 'ruby': expectedType = NodeType.RUBY; break;
                    case 'rt': expectedType = NodeType.RUBY_TEXT; break;
                    case 'v': expectedType = NodeType.VOICE; break;
                    case 'lang': expectedType = NodeType.LANG; break;
                    default: continue; // Ignore unknown end tags
                }
                
                // Walk up stack to find match
                let node = current;
                let found = false;
                
                while (node.parent) { // never match root
                    if (node.type === expectedType) {
                        found = true;
                        break;
                    }
                    node = node.parent;
                }
                
                if (found && node.parent) {
                    // Set current to the parent of the matched node (effectively closing it and all intermediate open tags)
                    // "If the tag name is found... let current be the parent of the node..."
                    current = node.parent;
                }
            }
            break;
    }
  }
  
  return root;
}
