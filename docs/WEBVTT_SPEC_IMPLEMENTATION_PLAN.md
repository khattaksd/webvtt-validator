# WebVTT Spec Implementation Plan (W3C)

This document is a **living plan** for implementing a WebVTT parser/validator according to the W3C WebVTT specification, with primary focus on:

- WebVTT parser algorithm: https://w3c.github.io/webvtt/#webvtt-parser
- Parsing subsections in §6: file parsing, region parsing, cue timings/settings parsing, cue text parsing, DOM construction.

It is intentionally written as a tracker: checkboxes, milestones, and a conformance matrix for tests.

## Goals

- Implement **spec-accurate parsing** (not just heuristic validation).
- Support **cue text parsing** (tokenizer + node tree + DOM construction rules) as specified.
- Provide **structured diagnostics** (errors/warnings) with good formatting.
- **Clean, spec-aligned API** (no legacy constraints).
- Make strictness and CSS handling configurable via options.

## Non-goals (for now)

- Rendering algorithms (§7) beyond what is necessary for validation.
- Full CSSOM integration; CSS handling is configurable and defaults to a safe/portable mode.

---

## Proposed Public API

### Primary Entry Point

```typescript
import { parse } from 'webvtt-parser';

const result = parse(inputString, options);
```

### Types

#### `ParseResult`

- `cues: Cue[]`
- `regions: Region[]`
- `stylesheets: Stylesheet[]` // Raw CSS text or parsed rules
- `diagnostics: Diagnostic[]`
- `metadata: Metadata` // File-level metadata from header

#### `Cue` (Spec-aligned)

- `id: string`
- `startTime: number`
- `endTime: number`
- `pauseOnExit: boolean`
- `vertical: "rl" | "lr" | null`
- `snapToLines: boolean`
- `line: number | "auto"`
- `lineAlign: "start" | "center" | "end" | null`
- `position: number | "auto"`
- `positionAlign: "line-left" | "center" | "line-right" | "auto"`
- `size: number`
- `align: "start" | "center" | "end" | "left" | "right"`
- `text: string` // Raw payload
- `tree?: WebVTTNode` // Parsed node tree (if enabled)

#### `Diagnostic`

- `severity: "error" | "warning" | "info"`
- `code: number` (or string enum)
- `message: string`
- `line: number`
- `col: number`
- `raw?: string` // The offending text

---

## Options (configurable defaults)

### `ParserOptions`

- `strict: boolean | "w3c" | "best-effort"`
  - Default: `"w3c"`
  - `"w3c"`: abort on fatal signature violations; treat algorithm “abort” as parse failure.
  - `"best-effort"`: attempt recovery (still record diagnostics).
- `css: {
    mode: "collect" | "parse" | "ignore";
    maxBytes?: number;
  }`
  - Default: `{ mode: "collect", maxBytes: 256_000 }`
  - `collect`: store raw `cssText` per STYLE block.
  - `parse`: optionally parse rules (future; can start as a stub).
  - `ignore`: discard STYLE blocks.
- `diagnostics: {
    includeSpecLinks: boolean;
    maxDiagnostics: number;
  }`
  - Default: `{ includeSpecLinks: true, maxDiagnostics: 1000 }`
- `output: {
    includeCues: boolean;
    includeRegions: boolean;
    includeStylesheets: boolean;
    includeCueTextNodes: boolean;
  }`
  - Default: `{ includeCues: true, includeRegions: true, includeStylesheets: true, includeCueTextNodes: true }`

---

## Implementation overview (module layout)

The current `src/webvtt-validator.js` is a single file. To implement the full spec cleanly, restructure into a small set of internal modules and re-export from the entry.

Proposed structure:

- `src/index.js` (or keep `src/webvtt-validator.js` as entry)
- `src/parser/`
  - `parse-webvtt.js` (top-level §6.1)
  - `scanner.js` (pointer-based scanning helpers; line/whitespace collection)
  - `normalization.js` (NUL/CRLF/CR normalization)
  - `signature.js` (WEBVTT signature validation)
  - `block.js` (collect WebVTT block; emits cue/region/style)
  - `timestamp.js` (collect WebVTT timestamp algorithm)
  - `cue-settings.js` (§6.3 settings parsing)
  - `region-settings.js` (§6.2)
  - `cue-text/`
    - `tokenizer.js` (WebVTT cue text tokenizer)
    - `parse-nodes.js` (§6.4 cue text parsing rules)
    - `dom-construction.js` (§6.5 DOM construction rules)
  - `model.js` (Cue/Region/Stylesheet constructors + defaults)
  - `diagnostics.js` (Diagnostic factory + formatting)
- `test/`
  - `conformance/` (spec-mapped tests)
  - `fixtures/` (`.vtt` and cue-text samples)

Note: The build currently uses Vite library mode; keep that. Add Vitest for tests.

---

## Milestones

### Milestone A — Parser foundation (§6.1)

- [x] Implement `normalizeInput()` (replace NUL, normalize CRLF/CR to LF)
- [x] Implement signature validation (exact rules in §6.1 steps 7–9)
- [x] Implement scanner/pointer utilities (collect line, collect LF run, skip ASCII whitespace)
- [x] Implement top-level parse loop that collects blocks until EOF

### Milestone B — Block collection (§6.1 “collect a WebVTT block”)

- [x] Implement block reading until blank line / EOF
- [x] Implement cue detection rules around `-->` and cue identifier buffering
- [x] Implement STYLE block detection and collection
- [x] Implement REGION block detection and collection
- [x] Attach cue payload text to cue correctly
- [x] Recovery behavior under `strict` option

### Milestone C — Regions (§6.2)

- [x] Implement `parsePercentageString()`
- [x] Implement `parseRegionSettings()`
- [x] Validate region defaults

### Milestone D — Cue timings/settings (§6.3)

- [x] Implement spec-accurate timestamp parsing
- [x] Implement cue timing line parsing including strict arrow parsing
- [x] Implement cue settings parsing: `region`, `vertical`, `line`, `position`, `size`, `align`
- [x] Apply spec side-effects (e.g., vertical => region null)
- [x] Validate start < end

### Milestone E — Cue text parsing (§6.4)

- [x] Implement cue text tokenizer (start tags, end tags, timestamps, text runs, escapes)
- [x] Implement node model:
  - Internal nodes: `root`, `c`, `i`, `b`, `u`, `ruby`, `rt`, `v`, `lang`
  - Leaf nodes: `text`, `timestamp`
- [x] Implement language stack handling and class accumulation
- [x] Implement rules for malformed tags (generate diagnostics, apply recovery per spec)
- [x] Emit node tree onto cue as `cue.nodes` when enabled

### Milestone F — DOM construction (§6.5)

- [x] Implement DOM construction rules (conceptual DOM; not browser DOM)
- [x] Validate that constructed DOM matches node tree expectations

### Milestone G — Structured diagnostics + formatting

- [x] Implement diagnostic schema + helpers
- [x] Provide `formatDiagnostics()`
- [x] Update `validate()` to return `diagnostics`, and also derived `errors[]`/`warnings[]`

### Milestone H — Test harness + conformance suite

- [x] Add `vitest` and wire `pnpm test`
- [x] Create conformance matrix tests for each spec section
- [x] Add fixtures and golden outputs where appropriate

---

## Test plan (spec-mapped conformance matrix)

### §6.1 WebVTT file parsing

- [x] **Normalization**
  - NUL -> U+FFFD
  - CRLF -> LF
  - CR -> LF
- [x] **Signature**
  - exact `WEBVTT` only
  - 7th char whitespace/LF requirement
  - abort behavior under `strict` vs recover under `best-effort`
- [x] **Header collection**
  - header metadata lines are consumed as header block
  - header block does not create cues
- [x] **Block loop**
  - multiple cues
  - blank line separation
  - EOF edge cases

### §6.2 Region settings

- [x] Parse `id`, `width`, `lines`, `regionanchor`, `viewportanchor`, `scroll`
- [x] Ignore invalid tokens (do not error unless `strict` demands warnings)

### §6.3 Cue timings and settings

- [x] Arrow parsing exactly `-->`
- [x] Timestamp parsing rules (valid and invalid)
- [x] Start < end
- [x] Settings:
  - region lookup ("last region with id")
  - vertical side-effects
  - line numeric/percent + line alignment
  - position percent + alignment
  - size percent
  - align keywords

### §6.4 Cue text parsing rules

Tokenizer tests:
- [x] Plain text and escapes
- [x] Start/end tags (`<i>...</i>`, `<b>`, `<u>`, `<c.class>`, `<v Voice>`, `<lang en>`)
- [x] Ruby constructs (`<ruby>`, `<rt>`)
- [x] Timestamp tags inside cue text
- [x] Malformed tags recovery cases

Node tree tests:
- [x] Correct nesting and tree shape
- [x] Applicable classes and language propagation
- [x] Voice value preservation

### §6.5 DOM construction rules

- [x] Constructed DOM-like objects match expected structure
- [x] Ensure timestamps/text nodes end up in correct order

### Cross-cutting: diagnostics

- [x] Codes are stable and tested (snapshot or explicit assertions)
- [x] Locations are correct for line/column
- [x] Formatting output is readable and deterministic

---

## Diagnostic codes (initial list)

This list is intentionally incomplete; expand as implementation proceeds.

### Signature / file-level

- `vtt.signature.invalid`
- `vtt.signature.too_short`

### Timestamps / cue timings

- `vtt.timestamp.invalid`
- `vtt.cue.timing.invalid_order`
- `vtt.cue.arrow.invalid`

### Blocks

- `vtt.block.unexpected`
- `vtt.style.ignored`

### Cue text

- `vtt.cuetext.tokenizer.error`
- `vtt.cuetext.tag.malformed`
- `vtt.cuetext.tag.unexpected_end`
- `vtt.cuetext.timestamp.invalid`

---

## Work tracking

When implementing:

- Prefer small PR-sized steps mapped to milestones above.
- Add a checklist item here when complete, and link to the commit/PR.

---

## Open decisions

- CSS `parse` mode: do we want a minimal CSS tokenizer/parser, or only collect raw text?
- Strictness semantics: which spec “abort” steps become fatal errors vs recoverable diagnostics in `best-effort`?
- DOM construction: store as simple JSON DOM (recommended) vs attempt to use real DOM in browser contexts.
