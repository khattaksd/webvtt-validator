import { normalizeInput } from './normalization.js';
import { Scanner } from './scanner.js';
import { validateSignature } from './signature.js';
import { collectBlock } from './block.js';
import { DiagnosticSeverity } from './diagnostics.js';

/**
 * @typedef {Object} ParserOptions
 * @property {boolean|"w3c"|"best-effort"} [strict="w3c"]
 * @property {Object} [css]
 * @property {string} [css.mode="collect"] "collect" | "parse" | "ignore"
 */

/**
 * @typedef {Object} ParseResult
 * @property {import('./model.js').Cue[]} cues
 * @property {import('./model.js').Region[]} regions
 * @property {import('./model.js').Stylesheet[]} stylesheets
 * @property {import('./diagnostics.js').Diagnostic[]} diagnostics
 * @property {Object} metadata
 */

/**
 * Parses WebVTT input.
 * @param {string} input
 * @param {ParserOptions} [options]
 * @returns {ParseResult}
 */
export function parse(input, options = {}) {
  const strict = options.strict ?? 'w3c';
  
  // 1. Normalize
  const normalized = normalizeInput(input);
  
  // 2. Validate Signature
  const diagnostics = validateSignature(normalized);
  
  // If strict w3c and signature invalid, abort
  const hasError = diagnostics.some(d => d.severity === DiagnosticSeverity.Error);
  if (strict === 'w3c' && hasError) {
    return {
      cues: [],
      regions: [],
      stylesheets: [],
      diagnostics,
      metadata: {}
    };
  }

  // 3. Parser Loop
  const scanner = new Scanner(normalized);
  
  // Skip signature line (we know it's there or we continued anyway)
  // If signature was valid, we are at line 1.
  // We need to advance scanner past the "WEBVTT..." line.
  if (scanner.peek() === 'W') { 
      scanner.collectLine();
  }
  // Spec step 12: Advance position to the next character in input (consume LF of signature line)
  scanner.scanLineEnding();

  const cues = [];
  const regions = [];
  const stylesheets = [];

  // Header block parsing (metadata)
  // Spec step 14: Header: If char is not LF, collect Header Block.
  if (scanner.peek() !== '\n' && !scanner.isEnd()) {
      // Collect header block
      collectBlock(scanner, { inHeader: true });
      // Header block doesn't produce cues/regions/styles usually, just metadata
      // But for now we just consume it.
  } else {
      // Otherwise (it IS a LF), advance position (consume blank line LF)
      scanner.scanLineEnding();
  }

  // Spec step 15: Collect a sequence of code points that are U+000A LINE FEED (LF) characters.
  scanner.scanLineEndings();

  // Block loop
  while (!scanner.isEnd()) {
      const block = collectBlock(scanner, { 
          inHeader: false,
          regions,
          parseCueText: options.output?.includeCueTextNodes ?? true
      });
      
      if (block.diagnostics && block.diagnostics.length > 0) {
          diagnostics.push(...block.diagnostics);
      }
      
      if (block.type === 'cue' && block.value) {
          cues.push(block.value);
      } else if (block.type === 'region' && block.value) {
          regions.push(block.value);
      } else if (block.type === 'style' && block.value) {
          stylesheets.push(block.value);
      }
      
      scanner.scanLineEndings();
  }

  return {
    cues,
    regions,
    stylesheets,
    diagnostics,
    metadata: {} // TODO
  };
}
