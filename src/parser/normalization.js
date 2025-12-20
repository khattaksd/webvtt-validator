/**
 * Normalizes input string according to WebVTT spec.
 * 1. Replace all U+0000 NULL characters by U+FFFD REPLACEMENT CHARACTERs.
 * 2. Replace each U+000D CARRIAGE RETURN U+000A LINE FEED (CRLF) character pair by a single U+000A LINE FEED (LF) character.
 * 3. Replace all remaining U+000D CARRIAGE RETURN characters by U+000A LINE FEED (LF) characters.
 * @param {string} input
 * @returns {string}
 */
export function normalizeInput(input) {
  if (!input) return '';
  return input
    .replace(/\u0000/g, '\uFFFD')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}
