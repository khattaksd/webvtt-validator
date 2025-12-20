/**
 * Pointer-based scanner for WebVTT parsing.
 * Tracks position, line, and column.
 */
export class Scanner {
  /**
   * @param {string} input - Normalized input (only LFs)
   */
  constructor(input) {
    this.input = input;
    this.length = input.length;
    this.position = 0;
  }

  isEnd() {
    return this.position >= this.length;
  }

  peek() {
    return this.input[this.position] || '';
  }

  /**
   * Consumes characters while they match the predicate.
   * @param {Function} predicate - (char: string) => boolean
   * @returns {string} The consumed string
   */
  collectWhile(predicate) {
    const start = this.position;
    while (this.position < this.length && predicate(this.input[this.position])) {
      this.position++;
    }
    return this.input.slice(start, this.position);
  }

  /**
   * Collects a sequence of code points that are NOT U+000A LINE FEED (LF).
   * Advances position past the collected characters.
   * Does NOT consume the LF itself.
   * @returns {string} The line content
   */
  collectLine() {
    const start = this.position;
    while (this.position < this.length && this.input[this.position] !== '\n') {
      this.position++;
    }
    return this.input.slice(start, this.position);
  }

  /**
   * Advances position past any U+000A LINE FEED (LF) characters.
   */
  scanLineEndings() {
    while (this.position < this.length && this.input[this.position] === '\n') {
      this.position++;
    }
  }

  /**
   * Advances position past exactly one U+000A LINE FEED (LF) character if present.
   * @returns {boolean} True if a newline was consumed
   */
  scanLineEnding() {
    if (this.position < this.length && this.input[this.position] === '\n') {
      this.position++;
      return true;
    }
    return false;
  }

  /**
   * Skips ASCII whitespace.
   * WebVTT space characters: U+0020 SPACE, U+0009 TAB, U+000C FORM FEED.
   * (Wait, spec says "ASCII whitespace" usually includes LF too in HTML, 
   * but in some WebVTT contexts it might be restricted. 
   * §6.3 says "Skip whitespace" links to HTML infrastructure "Skip whitespace", 
   * which matches ASCII whitespace: TAB, LF, FF, CR, SPACE.
   * BUT, in block loop, we process lines, so we might handle LF separately.)
   */
  skipWhitespace() {
    while (this.position < this.length) {
      const c = this.input[this.position];
      // HTML whitespace: space, tab, LF, FF, CR.
      // Since we normalized, we only have LF, space, tab, FF.
      if (c === ' ' || c === '\t' || c === '\n' || c === '\f') {
        this.position++;
      } else {
        break;
      }
    }
  }
  
  /**
   * Scan specific string if it matches at current position.
   * @param {string} str 
   * @returns {boolean} True if matched and advanced
   */
  scan(str) {
    if (this.input.startsWith(str, this.position)) {
      this.position += str.length;
      return true;
    }
    return false;
  }
}
