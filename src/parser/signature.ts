import { DiagnosticSeverity, DiagnosticCode, createDiagnostic, Diagnostic } from './diagnostics.ts';

/**
 * Validates WebVTT file signature.
 * @param {string} input - Normalized input
 * @returns {import('./diagnostics.ts').Diagnostic[]}
 */
export function validateSignature(input: string): Diagnostic[] {
  const diagnostics = [];
  
  if (input.length < 6) {
    diagnostics.push(createDiagnostic(
      DiagnosticSeverity.Error,
      DiagnosticCode.SIGNATURE_TOO_SHORT,
      'File too short to be WebVTT',
      1, 1, input
    ));
    return diagnostics;
  }

  const prefix = input.slice(0, 6);
  if (prefix !== 'WEBVTT') {
    diagnostics.push(createDiagnostic(
      DiagnosticSeverity.Error,
      DiagnosticCode.SIGNATURE_INVALID,
      'Invalid WebVTT signature',
      1, 1, prefix
    ));
    return diagnostics;
  }

  if (input.length > 6) {
    const char7 = input[6];
    // Must be space (U+0020), tab (U+0009), or LF (U+000A)
    // Note: Spec says U+0020, U+0009, or U+000A.
    // Normalized input has LF.
    if (char7 !== ' ' && char7 !== '\t' && char7 !== '\n') {
      diagnostics.push(createDiagnostic(
        DiagnosticSeverity.Error,
        DiagnosticCode.SIGNATURE_INVALID,
        'Invalid character after WEBVTT signature',
        1, 7, char7
      ));
    }
  }

  return diagnostics;
}
