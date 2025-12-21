/**
 * WebVTT Validator
 * A lightweight library for validating WebVTT files in the browser
 */

class WebVTTValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate WebVTT content
   * @param {string} content - The WebVTT content to validate
   * @returns {Object} Validation result with errors and warnings
   */
  validate(content) {
    this.errors = [];
    this.warnings = [];

    if (!content) {
      this.errors.push('Empty content provided');
      return this.getResult();
    }

    const lines = content.split(/\r?\n/);
    this.validateHeader(lines[0]);
    this.validateCueBlocks(lines);
    this.validateTimestamps(lines);

    return this.getResult();
  }

  validateHeader(firstLine) {
    if (!firstLine.startsWith('WEBVTT')) {
      this.errors.push('Missing or invalid WEBVTT header');
    }
  }

  validateCueBlocks(lines) {
    let inCue = false;
    let cueCounter = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Check for cue timestamp line
      if (line.includes('-->')) {
        inCue = true;
        cueCounter++;
        continue;
      }
      
      // If we're in a cue and hit a blank line, end of cue
      if (inCue && !line) {
        inCue = false;
      }
    }

    if (cueCounter === 0) {
      this.warnings.push('No cue blocks found');
    }
  }

  validateTimestamps(lines) {
    const timestampRegex = /^(\d{2}:)?\d{2}:\d{2}[\.:]\d{3}\s*-->\s*(\d{2}:)?\d{2}:\d{2}[\.:]\d{3}/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        if (!timestampRegex.test(line)) {
          this.errors.push(`Invalid timestamp format at line ${i + 1}: ${line}`);
        } else {
          const [start, end] = line.split('-->').map(ts => this.parseTimestamp(ts.trim()));
          if (start >= end) {
            this.errors.push(`Invalid cue timing at line ${i + 1}: End time must be after start time`);
          }
        }
      }
    }
  }

  parseTimestamp(timestamp) {
    const parts = timestamp.split(/[:.]/);
    let hours = 0, minutes = 0, seconds, milliseconds;
    
    if (parts.length === 3) {
      [hours, minutes, seconds] = parts.map(Number);
      milliseconds = 0;
    } else if (parts.length === 4) {
      [hours, minutes, seconds, milliseconds] = parts.map(Number);
    } else {
      return 0;
    }
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }

  getResult() {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebVTTValidator;
}
if (typeof window !== 'undefined') {
  window.WebVTTValidator = WebVTTValidator;
}

export default WebVTTValidator;
