---
name: font-measurement
description: Pixel-accurate font measurement for Even Realities G2 glasses — predict text layout dimensions matching the LVGL rendering engine. Use when sizing text containers precisely.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [measurement or layout sizing task]
---

# even-pretext: Font Measurement Library

Pixel-accurate text measurement for Even Realities G2 smart glasses. Predicts exact layout dimensions matching the LVGL rendering engine in the glasses firmware.

> **Note:** Results may be off for characters not present in the firmware fonts, since the firmware and this library may handle missing glyphs differently in some cases.

## Installation

```bash
npm install @evenrealities/pretext
```

## Display Constants

- **Screen**: 576 x 288 pixels
- **Line height**: 27px (fixed)
- **List item height**: 40px (fixed)
- **List item horizontal padding**: 12px per side

## API

All functions are exported from `@evenrealities/pretext`.

### `getTextWidth(text: string): number`

Returns single-line pixel width of a string (with kerning, no wrapping).

```ts
import { getTextWidth } from '@evenrealities/pretext';
const width = getTextWidth('Hello, world!'); // => 79
```

### `measureTextWrap(text: string, maxWidth: number): MeasureTextResult`

Measures multi-line text layout with word wrapping. `maxWidth` should be the inner content width — subtract padding and border before calling. The returned `height` is pure text height.

```ts
import { measureTextWrap } from '@evenrealities/pretext';

const result = measureTextWrap('The quick brown fox jumps over the lazy dog', 200);
// => { lineCount: 2, height: 54, lineWidths: [192, 96] }

// With padding + border — caller handles the math:
const pad = 8, border = 2;
const m = measureTextWrap('Hello world', 300 - 2 * (pad + border));
const containerHeight = m.height + 2 * (pad + border);
```

**Parameters:**

| Parameter  | Type     | Default | Description                                                  |
|------------|----------|---------|--------------------------------------------------------------|
| `text`     | `string` | —       | The string to measure                                        |
| `maxWidth` | `number` | —       | Available width for text in pixels (subtract padding/border) |

**Returns:**

| Field        | Type       | Description                          |
|--------------|------------|--------------------------------------|
| `lineCount`  | `number`   | Number of lines after wrapping       |
| `height`     | `number`   | Total text height (`lineCount * 27`) |
| `lineWidths` | `number[]` | Pixel width of each wrapped line     |

### `pxTruncate(text: string, maxPx: number): string`

Truncates a string to fit within a pixel budget, appending `'...'` if needed. Returns the original string unchanged when it already fits. Uses binary search and handles emoji/surrogate pairs correctly.

```ts
import { pxTruncate } from '@evenrealities/pretext';

const label = pxTruncate('Hello, world!', 50); // => 'Hell...'
const fits  = pxTruncate('Hi', 50);            // => 'Hi'
```

**Parameters:**

| Parameter | Type     | Description                    |
|-----------|----------|--------------------------------|
| `text`    | `string` | The string to truncate         |
| `maxPx`   | `number` | Maximum width in pixels        |

**Returns:** The original string if it fits, otherwise a truncated string ending with `'...'`.

> **Note:** This function is single-line only. For multiline text, truncate each line individually.

### `getAdvW(cp: number): number`

Returns raw advance width of a codepoint in 1/16px units (no kerning, no rounding). Useful for debugging or custom measurement logic.

## Accounting for Padding and Borders

When a `TextContainerProperty` has `paddingLength` or `borderWidth`, the SDK's LVGL renderer subtracts these from the available text area **inside** the container. If you measure text against the full container width/height, the content will overflow and a scrollbar appears.

### How padding and border affect the text area

```
Container (width × height)
┌─ border (borderWidth pixels) ─────────────────────┐
│ ┌─ padding (paddingLength pixels) ──────────────┐ │
│ │                                                │ │
│ │   Text renders here                            │ │
│ │   innerWidth  = width  - 2*padding - 2*border  │ │
│ │   innerHeight = height - 2*padding - 2*border  │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### Rules

- `paddingLength: N` reduces text area by `N` pixels on **all four sides**
- `borderWidth: N` reduces text area by `N` pixel on **all four sides** (border is drawn inside the container)
- Both stack: total inset = `paddingLength + borderWidth` per side
- If neither is set, text renders at the full container width/height

### Measuring text for a container with padding/border

```ts
import { measureTextWrap } from '@evenrealities/pretext';

const containerW = 560;
const containerH = 258;
const padding = 8;  // paddingLength
const border = 1;   // borderWidth

const inset = padding + border;
const innerW = containerW - 2 * inset;
const innerH = containerH - 2 * inset;
const maxLines = Math.floor(innerH / 27);

// Measure and truncate against the INNER dimensions
const m = measureTextWrap(text, innerW);
if (m.lineCount > maxLines) {
  text = truncateToFitLines(text, innerW, maxLines);
}
```

### Common mistake

```ts
// WRONG — measures against container width, ignores padding/border
const m = measureTextWrap(text, 560);

// RIGHT — subtracts padding and border from both sides
const m = measureTextWrap(text, 560 - 2 * (padding + border));
```

## Common Patterns

### Size a text container to fit its content

```ts
import { measureTextWrap } from '@evenrealities/pretext';

const containerWidth = 300;
const padding = 8;
const innerW = containerWidth - 2 * padding;
const result = measureTextWrap(myText, innerW);
const containerHeight = result.height + 2 * padding;
// Use Math.max(...result.lineWidths) + 2 * padding for tight container width
```

### Truncate text to fit a container

```ts
import { pxTruncate } from '@evenrealities/pretext';

// Single-line truncation
const label = pxTruncate(longText, containerWidth);

// Multiline: truncate each line individually
import { measureTextWrap } from '@evenrealities/pretext';
const { lineWidths } = measureTextWrap(longText, containerWidth);
// If the last line is too long after wrapping, truncate it
```

## Instructions

When using this library to size UI containers for Even Realities glasses:

1. **Always use this library** to predict text dimensions before creating containers. Do not guess pixel sizes.
2. **Line height is 27px** — multiply by line count for text container height.
3. **List items are 40px tall** — multiply by item count and add `2 * padding` for list container height.
4. **Max display is 576 x 288.** Ensure containers fit within these bounds.
5. When pairing with the glasses-ui skill, use `measureTextWrap` results to set container `width` and `height` properties precisely.
6. **When a container has `paddingLength` or `borderWidth`**, subtract these from the container dimensions before measuring text. Failing to do so causes content overflow and a scrollbar. See "Accounting for Padding and Borders" above.

## Task

$ARGUMENTS
