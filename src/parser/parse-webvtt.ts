import { normalizeInput } from './normalization.ts';
import { Scanner } from './scanner.ts';
import { validateSignature } from './signature.ts';
import { collectBlock } from './block.ts';
import { DiagnosticSeverity, Diagnostic } from './diagnostics.ts';
import { Cue, Region, Stylesheet } from './model.ts';

/**
 * Options for configuring the WebVTT parser behavior.
 */
export interface ParserOptions {
  strict?: boolean | "w3c" | "best-effort";
  css?: {
    mode?: "collect" | "parse" | "ignore";
  };
  output?: {
    includeCueTextNodes?: boolean;
  };
}

/**
 * The result of parsing a WebVTT file.
 */
export interface ParseResult {
  cues: Cue[];
  regions: Region[];
  stylesheets: Stylesheet[];
  diagnostics: Diagnostic[];
  metadata: Record<string, any>;
}

/**
 * Parses WebVTT input.
 */
export function parse(input: string, options: ParserOptions = {}): ParseResult {
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

  const cues: Cue[] = [];
  const regions: Region[] = [];
  const stylesheets: Stylesheet[] = [];

  // Header block parsing (metadata)
  // Spec step 14: Header: If char is not LF, collect Header Block.
  if (!scanner.isEnd()) {
      const headerLineStart = scanner.position;
      const headerCandidateLine = scanner.collectLine();
      scanner.position = headerLineStart;

      // Treat whitespace-only line as a blank separator line.
      // This is important because some files may use a space-only line between signature and first cue.
      if (headerCandidateLine.trim() === '') {
          scanner.collectLine();
          scanner.scanLineEnding();
      } else {
          // Collect header block
          const headerBlock = collectBlock(scanner, {
            inHeader: true,
            regions,
            parseCueText: options.output?.includeCueTextNodes ?? true,
          });

          if (headerBlock.diagnostics && headerBlock.diagnostics.length > 0) {
            diagnostics.push(...headerBlock.diagnostics);
          }

          // Best-effort: if a cue/style/region is encountered in the header, collect it.
          // (We already emitted a diagnostic in block collection for cue-in-header.)
          if (headerBlock.type === 'cue' && headerBlock.value) {
            cues.push(headerBlock.value as Cue);
          } else if (headerBlock.type === 'region' && headerBlock.value) {
            regions.push(headerBlock.value as Region);
          } else if (headerBlock.type === 'style' && headerBlock.value) {
            stylesheets.push(headerBlock.value as Stylesheet);
          }
      }
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
          cues.push(block.value as Cue);
      } else if (block.type === 'region' && block.value) {
          regions.push(block.value as Region);
      } else if (block.type === 'style' && block.value) {
          stylesheets.push(block.value as Stylesheet);
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
