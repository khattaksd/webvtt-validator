# WebVTT Validator

A lightweight JavaScript library for validating WebVTT (Web Video Text Tracks) files in the browser. This library provides a simple API for validating WebVTT content and comes with a beautiful, responsive web interface for testing.

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

### Via pnpm

```bash
pnpm add webvtt-validator
```

### Via CDN

```html
<script src="https://unpkg.com/webvtt-validator/dist/webvtt-validator.umd.js"></script>
```

## Usage

### In the Browser

```html
<script src="path/to/webvtt-validator.umd.js"></script>
<script>
  const validator = new WebVTTValidator();
  const result = validator.validate('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');
  
  console.log(result);
  // {
  //   isValid: true,
  //   errors: [],
  //   warnings: []
  // }
</script>
```

### In Node.js

#### ESM

```javascript
import WebVTTValidator from 'webvtt-validator';

const validator = new WebVTTValidator();
const result = validator.validate('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');

console.log(result);
```

#### CommonJS (best effort)

```javascript
const WebVTTValidator = require('webvtt-validator');
const validator = new WebVTTValidator();
const result = validator.validate('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nHello, world!');

console.log(result);
```

### Web Interface

Open the `demo/index.html` file in your browser to use the web interface for validating WebVTT files.

## API Reference

### `new WebVTTValidator()`

Creates a new instance of the WebVTT validator.

### `validator.validate(content)`

Validates the provided WebVTT content.

**Parameters:**
- `content` (String): The WebVTT content to validate.

**Returns:**
- (Object): An object containing the validation results:
  - `isValid` (Boolean): `true` if the content is valid, `false` otherwise.
  - `errors` (Array): An array of error messages.
  - `warnings` (Array): An array of warning messages.

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

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Demo

Try the live demo by opening `demo/index.html` in your browser after building the project.
