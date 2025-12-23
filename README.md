# WebVTT Validator

[![CI](https://github.com/khattaksd/webvtt-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/khattaksd/webvtt-validator/actions/workflows/ci.yml)
[![Pages](https://github.com/khattaksd/webvtt-validator/actions/workflows/pages.yml/badge.svg)](https://github.com/khattaksd/webvtt-validator/actions/workflows/pages.yml)
[![npm](https://img.shields.io/npm/v/%40serendevity%2Fwebvtt-validator)](https://www.npmjs.com/package/@serendevity/webvtt-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A lightweight JavaScript library for validating WebVTT (Web Video Text Tracks) files in the browser. This library provides a simple API for validating WebVTT content and comes with a beautiful, responsive web interface for testing.

## Links

- Demo (GitHub Pages): https://khattaksd.github.io/webvtt-validator/
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security: [SECURITY.md](./SECURITY.md)
- License: [LICENSE](./LICENSE)

## Support policy

This package is tested against **Node current LTS and the previous LTS**.

- CommonJS (`require`) support is **best effort**.

## Features

- Validates WebVTT format and syntax
- Checks for common errors in timestamps and cue formatting
- Lightweight with no external dependencies
- Beautiful and responsive web interface
- Supports file upload and direct input
- Detailed error and warning messages

## Installation

### Node.js (via npm/pnpm/yarn)

```bash
# npm
npm install webvtt-validator

# pnpm
pnpm add webvtt-validator

# yarn
yarn add webvtt-validator
```

### Deno (via JSR)

```typescript
import { parse, DiagnosticSeverity, formatDiagnostics } from "jsr:@khattaksd/webvtt-validator";
```

Or add to your `deno.json`:

```json
{
  "imports": {
    "webvtt": "jsr:@khattaksd/webvtt-validator@^0.1.0"
  }
}
```

## Usage

### In Deno

```typescript
import { parse, DiagnosticSeverity, formatDiagnostics } from "jsr:@khattaksd/webvtt-validator";

const result = parse('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');

const errors = result.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
console.log(errors.length === 0);
console.log(formatDiagnostics(result.diagnostics));
```

### In the Browser

The `dist/index.mjs` bundle is browser-compatible ESM.

### In Node.js

#### ESM

```javascript
import { parse, DiagnosticSeverity, formatDiagnostics } from 'webvtt-validator';

const result = parse('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');

const errors = result.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
console.log(errors.length === 0);
console.log(formatDiagnostics(result.diagnostics));
```

#### CommonJS (best effort)

```javascript
const { parse, DiagnosticSeverity, formatDiagnostics } = require('webvtt-validator');

const result = parse('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');
const errors = result.diagnostics.filter(d => d.severity === DiagnosticSeverity.Error);
console.log(errors.length === 0);
console.log(formatDiagnostics(result.diagnostics));
```

### Web Interface

Open the `demo/index.html` file in your browser to use the web interface for validating WebVTT files.

## API Reference

### `parse(input, options?)`

Parses WebVTT input and returns cues plus a structured diagnostics list.

## Validation Rules

The validator checks for the following:

- Presence of the WEBVTT header
- Valid timestamp format (HH:MM:SS.mmm --> HH:MM:SS.mmm)
- Start time is before end time in each cue
- Proper cue separation with blank lines
- No empty cue blocks

## Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the library:
   ```bash
   pnpm run build
   ```

The built files will be available in the `dist` directory.

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Demo

Try the demo by opening `demo/index.html` in your browser after running `pnpm run build`.
