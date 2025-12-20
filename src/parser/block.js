import { Cue, Stylesheet } from './model.js';
import { parseTimestamp } from './timestamp.js';
import { parseCueSettings } from './cue-settings.js';
import { parseRegionSettings } from './region-settings.js';
import { parseCueText } from './cue-text/parse-nodes.js';
import { createDiagnostic, DiagnosticSeverity, DiagnosticCode } from './diagnostics.js';

/**
 * Represents a parsed block.
 * @typedef {Object} Block
 * @property {"cue"|"region"|"style"|"none"} type
 * @property {import('./model.js').Cue|import('./model.js').Region|import('./model.js').Stylesheet|null} value
 * @property {import('./diagnostics.js').Diagnostic[]} diagnostics
 */

/**
 * Collects a WebVTT block from the scanner.
 * @param {import('./scanner.js').Scanner} scanner
 * @param {Object} context
 * @param {boolean} context.inHeader
 * @param {import('./model.js').Region[]} [context.regions] - Known regions for cue settings
 * @returns {Block}
 */
export function collectBlock(scanner, context) {
  const lines = [];
  const diagnostics = [];
  
  // 1. Collect lines until blank line or EOF
  while (!scanner.isEnd()) {
    const line = scanner.collectLine();
    scanner.scanLineEnding(); // Consume strictly one newline
    
    if (line === '') {
      break; // Blank line ends block
    }
    lines.push(line);
  }
  
  if (lines.length === 0) {
    return { type: 'none', value: null, diagnostics };
  }
  
  // 2. Identify Block Type
  
  // Try to parse as Cue
  // Case A: Line 1 is "-->" (Timing line)
  // Case B: Line 2 is "-->" (Line 1 is ID)
  
  let isCue = false;
  let timingLineIndex = -1;
  
  if (lines[0].includes('-->')) {
    isCue = true;
    timingLineIndex = 0;
  } else if (lines.length > 1 && lines[1].includes('-->')) {
    isCue = true;
    timingLineIndex = 1;
  }
  
  if (isCue) {
    const cue = new Cue();
    
    // ID
    if (timingLineIndex === 1) {
      cue.id = lines[0];
    }
    
    // Parse Timing Line
    const timingLine = lines[timingLineIndex];
    // Strict requirement: "-->" must be surrounded by spaces? 
    // Spec: "Collect WebVTT timestamp... Skip whitespace... --> ... Skip whitespace..."
    // So "00:00.000-->00:01.000" is actually technically valid if timestamps parse?
    // Wait, Spec step 8: "If the character at position is not a U+003E GREATER-THAN SIGN character (>)..."
    // It steps char by char looking for HYPHEN HYPHEN GREATER-THAN.
    
    const arrowIndex = timingLine.indexOf('-->');
    if (arrowIndex === -1) {
        // Should not happen given logic above, but safety
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error, 
            DiagnosticCode.ARROW_INVALID, 
            'Missing --> in timing line', 
            0, 0, timingLine // TODO: Line numbers
        ));
        return { type: 'none', value: null, diagnostics };
    }
    
    const startStr = timingLine.slice(0, arrowIndex).trim();
    const rest = timingLine.slice(arrowIndex + 3);
    
    // Find end of timestamp in rest. 
    // Spec says: Skip whitespace, Collect timestamp. 
    // "Let remainder be the trailing substring... Parse settings from remainder"
    
    // Simple heuristic: First whitespace after timestamp ends timestamp?
    // Or we just try to parse the start of `rest` trimmed.
    const restTrimmed = rest.trim();
    // Split by space to get timestamp candidate
    const endTimestampCandidate = restTrimmed.split(/\s+/)[0];
    const settingsStr = restTrimmed.slice(endTimestampCandidate.length).trim();
    
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endTimestampCandidate);
    
    if (start === null || end === null) {
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            DiagnosticCode.TIMESTAMP_INVALID,
            'Invalid timestamp format',
            0, 0, timingLine
        ));
        // Continue to return cue? Maybe partial?
    } else {
        cue.startTime = start;
        cue.endTime = end;
        
        if (start > end) {
             diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                DiagnosticCode.CUE_TIMING_INVALID_ORDER,
                'Start time must be less than or equal to end time',
                0, 0, timingLine
            ));
        }
    }
    
    // Parse Settings
    if (settingsStr) {
        parseCueSettings(settingsStr, cue, context.regions || []);
    }
    
    // Parse Payload
    // Everything after timing line
    const payloadLines = lines.slice(timingLineIndex + 1);
    cue.text = payloadLines.join('\n');
    
    // Parse Node Tree if requested
    if (context.parseCueText !== false) {
        cue.tree = parseCueText(cue.text);
    }
    
    return { type: 'cue', value: cue, diagnostics };
  }
  
  // Not a cue.
  // Check for STYLE or REGION (only if !inHeader)
  // "If in header is not set and line count is 2..." -> Actually spec logic is messy about "line count".
  // Simplified: If it starts with STYLE/REGION and not a cue.
  
  if (!context.inHeader) {
      if (lines[0].startsWith('STYLE')) {
          const remainder = lines[0].slice(5);
          if (!remainder || /^\s*$/.test(remainder)) {
              // It is a style block
              const cssLines = lines.slice(1);
              return { 
                  type: 'style', 
                  value: new Stylesheet(cssLines.join('\n')), 
                  diagnostics 
              };
          }
      }
      
      if (lines[0].startsWith('REGION')) {
          const remainder = lines[0].slice(6);
          if (!remainder || /^\s*$/.test(remainder)) {
               // Region block
               // "Region settings are in the buffer"?
               // Spec says: "If buffer is not the empty string, append LF... Append line to buffer."
               // Actually the region settings are on the following lines?
               // Wait. Spec 6.1.11... "Region creation... Let buffer be the empty string."
               // Then it loops and collects lines into buffer.
               // Then calls `parseRegionSettings` on `buffer`? No, wait.
               // Spec says "When the WebVTT parser algorithm says to collect WebVTT region settings from a string input..."
               
               // Actually, for REGION block, usually the settings are on the lines *inside* the block?
               // No, look at examples. 
               // REGION
               // id:fred width:50%
               
               // Spec: "Block loop... Collect a WebVTT block... If block is WebVTT region object..."
               // Block collection logic: 
               // If line starts with REGION...
               // It enters a loop accumulating lines.
               // BUT, unlike Style, Region settings parsing (§6.2) takes a string input.
               // It splits on spaces.
               // This implies the settings are ON THE SAME LINE or spread? 
               // Actually, the block accumulation logic accumulates ALL lines of the block into `buffer`.
               // For REGION, it effectively concatenates them (with LFs).
               // Then 6.2 parses that whole string. 
               // "Let settings be the result of splitting input on spaces" => newlines become spaces effectively if split matches \s+.
               
               const regionPayload = lines.slice(1).join(' '); // Join with space to treat newlines as separators
               const region = parseRegionSettings(regionPayload);
               return { type: 'region', value: region, diagnostics };
          }
      }
  }
  
  // If we are here, it's neither Cue, Style, nor Region.
  // If in header, it's header data (ignored).
  // If not in header, it's "garbage" or valid comment/metadata?
  // Spec says: "If block is a WebVTT cue... Otherwise if block is CSS... Otherwise if Region..."
  // If none match, it's ignored.
  
  return { type: 'none', value: null, diagnostics };
}
