/**
 * Token types for WebVTT cue text.
 */
export const TokenType = {
  STRING: 'string',
  START_TAG: 'start-tag',
  END_TAG: 'end-tag',
  TIMESTAMP_TAG: 'timestamp-tag',
};

/**
 * WebVTT Cue Text Tokenizer.
 * Implements the state machine from §6.4.
 */
export class CueTextTokenizer {
  /**
   * @param {string} input - The raw cue text.
   */
  constructor(input) {
    this.input = input;
    this.position = 0;
  }

  /**
   * Returns the next token.
   * @returns {Object|null} Token object or null if EOF.
   */
  nextToken() {
    if (this.position >= this.input.length) {
      return null;
    }

    let buffer = '';
    let state = 'data';
    let result = null;
    
    // Token fields
    let tagName = '';
    let classes = [];
    let annotation = '';
    
    // Helper to emit
    const emit = (type, value) => {
        result = { type, value };
        if (type === TokenType.START_TAG) {
            result.tagName = tagName;
            result.classes = classes;
            result.annotation = annotation;
        } else if (type === TokenType.END_TAG) {
            result.tagName = tagName;
        }
    };

    while (this.position < this.input.length) {
      const c = this.input[this.position];
      
      switch (state) {
        case 'data':
          if (c === '&') {
            buffer += '&';
            this.position++;
            // Basic HTML entity handling could go here, but spec says "replace...".
            // Actually spec for "data state":
            // U+0026 AMPERSAND: Set additional allowed character to ";". Switch to "HTML character reference in data state".
            // We'll simplify and just collect chars for now, but handle strict escapes if needed.
            // For now, treat as string.
          } else if (c === '<') {
            if (buffer.length > 0) {
                // Emit collected string first
                emit(TokenType.STRING, buffer);
                return result;
            }
            state = 'tag';
            this.position++;
          } else {
            buffer += c;
            this.position++;
          }
          break;
          
        case 'tag':
          if (c === '\t' || c === '\n' || c === '\f' || c === ' ') {
             state = 'start tag annotation';
             this.position++;
          } else if (c === '.') {
             state = 'start tag class';
             this.position++;
          } else if (c === '/') {
             state = 'end tag';
             this.position++;
          } else if (/\d/.test(c)) {
             state = 'timestamp tag';
             buffer = c; // start buffer for timestamp
             this.position++;
          } else if (c === '>') {
             // End of tag
             this.position++;
             if (tagName) {
                 emit(TokenType.START_TAG, '');
                 return result;
             }
             // Empty tag <>? Just switch to data.
             state = 'data';
          } else {
             tagName += c;
             this.position++;
          }
          break;
          
        case 'start tag class':
          if (c === '\t' || c === '\n' || c === '\f' || c === ' ') {
              if (buffer) {
                  classes.push(buffer);
                  buffer = '';
              }
              state = 'start tag annotation';
              this.position++;
          } else if (c === '.') {
              if (buffer) {
                  classes.push(buffer);
                  buffer = '';
              }
              this.position++;
          } else if (c === '>') {
              if (buffer) {
                  classes.push(buffer);
              }
              this.position++;
              emit(TokenType.START_TAG, '');
              return result;
          } else {
              buffer += c;
              this.position++;
          }
          break;
          
        case 'start tag annotation':
          if (c === '>') {
              annotation = buffer.trim(); // Spec says "buffer is the annotation string"
              this.position++;
              emit(TokenType.START_TAG, '');
              return result;
          } else {
              buffer += c;
              this.position++;
          }
          break;
          
        case 'end tag':
           if (c === '>') {
               this.position++;
               emit(TokenType.END_TAG, '');
               return result;
           } else {
               tagName += c;
               this.position++;
           }
           break;
           
        case 'timestamp tag':
           if (c === '>') {
               this.position++;
               emit(TokenType.TIMESTAMP_TAG, buffer);
               return result;
           } else {
               buffer += c;
               this.position++;
           }
           break;
      }
    }
    
    // EOF handling
    if (buffer.length > 0) {
        if (state === 'data') {
            emit(TokenType.STRING, buffer);
            return result;
        }
        // If inside a tag at EOF, discard the tag? 
        // Spec: "If position is past end of input... return result".
        // If we were parsing a tag, we might have partial data.
        // Usually parsers just stop.
    }
    
    return result;
  }
}
