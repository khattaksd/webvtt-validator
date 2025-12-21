/**
 * Severity levels for parser diagnostics.
 */
export const DiagnosticSeverity = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
};

/**
 * Diagnostic codes for different types of parser errors and warnings.
 */
export const DiagnosticCode = {
  // Signature
  SIGNATURE_INVALID: 1000,
  SIGNATURE_TOO_SHORT: 1001,
  
  // Timestamps
  TIMESTAMP_INVALID: 2000,
  CUE_TIMING_INVALID_ORDER: 2001,
  ARROW_INVALID: 2002,
  
  // Blocks
  BLOCK_UNEXPECTED: 3000,
  STYLE_IGNORED: 3001,
  REGION_IGNORED: 3002,
  
  // Cue Text
  CUETEXT_TOKENIZER_ERROR: 4000,
  CUETEXT_TAG_MALFORMED: 4001,
  CUETEXT_TAG_UNEXPECTED_END: 4002,
  CUETEXT_TIMESTAMP_INVALID: 4003,
};

/**
 * Represents a diagnostic message (error, warning, or info) from the parser.
 */
export class Diagnostic {
  severity: string;
  code: number;
  message: string;
  line: number;
  col: number;
  raw: string;

  constructor(severity: string, code: number, message: string, line: number, col: number, raw: string) {
    this.severity = severity;
    this.code = code;
    this.message = message;
    this.line = line;
    this.col = col;
    this.raw = raw;
  }
}

export function createDiagnostic(severity: string, code: number, message: string, line: number, col: number, raw: string): Diagnostic {
  return new Diagnostic(severity, code, message, line, col, raw);
}

/**
 * Formats a list of diagnostics into a human-readable string.
 * @param {Diagnostic[]} diagnostics 
 * @param {Object} [options]
 * @param {boolean} [options.color=false] - (Not implemented yet, placeholder)
 * @param {number} [options.max] - Max number of diagnostics to show
 * @returns {string}
 */
export function formatDiagnostics(diagnostics: Diagnostic[], options: { color?: boolean; max?: number } = {}): string {
  if (!diagnostics || diagnostics.length === 0) {
    return 'No errors or warnings found.';
  }

  const max = options.max || Infinity;
  const shown = diagnostics.slice(0, max);
  const hidden = diagnostics.length - shown.length;

  let output = shown.map(d => {
    const loc = d.line ? `Line ${d.line}:${d.col || 0}` : 'File-level';
    const severity = d.severity.toUpperCase();
    return `[${severity}] ${loc} - ${d.message} (Code: ${d.code})`;
  }).join('\n');

  if (hidden > 0) {
    output += `\n... and ${hidden} more.`;
  }

  return output;
}
