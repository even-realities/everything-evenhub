---
name: font-measurement
description: Pixel-accurate font measurement for Even Realities G2 glasses — predict text layout dimensions matching the LVGL rendering engine. Use when sizing text or list containers precisely.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [measurement or layout sizing task]
---

# even-pretext: Font Measurement Library

Pixel-accurate text and list measurement for Even Realities G2 smart glasses. Predicts exact layout dimensions matching the LVGL rendering engine in the glasses firmware.

## Installation

Not yet on npm. Install from git:

```bash
npm install git+https://github.com/even-realities/even-pretext.git
```

For browser usage, include the pre-built bundle (exposes `window.FontMeasure`):

```html
<script src="public/lib/font_measure.js"></script>
```

## Display Constants

- **Screen**: 576 x 288 pixels
- **Line height**: 27px (fixed)
- **List item height**: 40px (fixed)
- **List item horizontal padding**: 12px per side

## API

All functions are exported from `even-pretext`.

### `getTextWidth(text: string): number`

Returns single-line pixel width of a string (with kerning, no wrapping).

```ts
import { getTextWidth } from 'even-pretext';
const width = getTextWidth('Hello, world!'); // => 79
```

### `measureTextWrap(text: string, maxWidth: number, containerPadding?: number): MeasureTextResult`

Measures multi-line text layout with word wrapping. When `containerPadding` is provided, it is subtracted from both sides of `maxWidth` for wrapping and added to top and bottom of the returned `height`.

```ts
import { measureTextWrap } from 'even-pretext';

// Without padding — maxWidth is the text area width
const result = measureTextWrap('The quick brown fox jumps over the lazy dog', 200);
// => { lineCount: 2, height: 54, lineWidths: [192, 96] }

// With padding — maxWidth is the container width, padding handled internally
const padded = measureTextWrap('Hello world', 300, 8);
// wraps within 300 - 16 = 284px, height includes 16px vertical padding
```

**Parameters:**

| Parameter          | Type     | Default | Description                                          |
|--------------------|----------|---------|------------------------------------------------------|
| `text`             | `string` | —       | The string to measure                                |
| `maxWidth`         | `number` | —       | Container width in pixels                            |
| `containerPadding` | `number` | `0`     | Padding in pixels (applied left, right, top, bottom) |

**Returns:**

| Field        | Type       | Description                                             |
|--------------|------------|---------------------------------------------------------|
| `lineCount`  | `number`   | Number of lines after wrapping                          |
| `height`     | `number`   | Total height (`lineCount * 27 + 2 * containerPadding`) |
| `lineWidths` | `number[]` | Pixel width of each wrapped line                        |

### `pxTruncate(text: string, maxPx: number): string`

Truncates a string to fit within a pixel budget, appending `'...'` if needed. Returns the original string unchanged when it already fits. Uses binary search and handles emoji/surrogate pairs correctly.

```ts
import { pxTruncate } from 'even-pretext';

const label = pxTruncate('Hello, world!', 60); // => 'Hell...'
const fits  = pxTruncate('Hi', 60);            // => 'Hi'
```

**Parameters:**

| Parameter | Type     | Description                    |
|-----------|----------|--------------------------------|
| `text`    | `string` | The string to truncate         |
| `maxPx`   | `number` | Maximum width in pixels        |

**Returns:** The original string if it fits, otherwise a truncated string ending with `'...'`.

> **Note:** This function is single-line only. For multiline text, truncate each line individually.

### `measureList(items, containerPadding?, containerHeight?): MeasureListResult`

Measures a list container layout. Each item is 40px tall. When `itemWidth > 0`, text is truncated with ellipsis; when `0` (default) it auto-sizes.

```ts
import { measureList } from 'even-pretext';
const result = measureList(
  [
    { text: 'First item' },
    { text: 'Second item' },
    { text: 'Truncated text here', itemWidth: 100 },
  ],
  8,   // containerPadding (optional, default 0)
  200, // containerHeight (optional — omit to derive required height)
);
```

**Parameters:**

| Parameter          | Type                                          | Default | Description                                              |
|--------------------|-----------------------------------------------|---------|----------------------------------------------------------|
| `items`            | `Array<{ text: string; itemWidth?: number }>` | —       | List items to measure                                    |
| `containerPadding` | `number`                                      | `0`     | Padding in pixels (top and bottom)                       |
| `containerHeight`  | `number`                                      | —       | Container height; omit to derive the required height     |

**Returns:**

| Field            | Type      | Description                                                    |
|------------------|-----------|----------------------------------------------------------------|
| `itemHeight`     | `number`  | Always `40`                                                    |
| `contentHeight`  | `number`  | `items.length * 40`                                            |
| `requiredHeight` | `number`  | Minimum container height for all items without scrolling       |
| `items`          | `Array`   | Per-item: `textWidth`, `labelWidth`, `isTruncated`             |
| `visibleHeight`  | `number?` | Inner height after padding (only when `containerHeight` given) |
| `isCentered`     | `boolean?`| Whether items are vertically centered                          |
| `visibleCount`   | `number?` | Items visible without scrolling                                |
| `firstItemY`     | `number?` | Y offset of first item relative to content area top            |

### `getAdvW(cp: number): number`

Returns raw advance width of a codepoint in 1/16px units (no kerning, no rounding). Useful for debugging or custom measurement logic.

## Common Patterns

### Size a text container to fit its content

```ts
import { measureTextWrap } from 'even-pretext';

const containerWidth = 300;
const padding = 8;
const result = measureTextWrap(myText, containerWidth, padding);
// result.height already includes vertical padding — use directly as container height
// Use Math.max(...result.lineWidths) for tight container width
```

### Size a list container to fit all items

```ts
import { measureList } from 'even-pretext';

const padding = 8;
const result = measureList(items, padding);
// Use result.requiredHeight for container height
```

### Truncate text to fit a container

```ts
import { pxTruncate } from 'even-pretext';

// Single-line truncation
const label = pxTruncate(longText, containerWidth);

// Multiline: truncate each line individually
import { measureTextWrap } from 'even-pretext';
const { lineWidths } = measureTextWrap(longText, containerWidth);
// If the last line is too long after wrapping, truncate it
```

### Check if list items will be truncated

```ts
const result = measureList(
  items.map(text => ({ text, itemWidth: 150 })),
  0, 200
);
result.items.forEach(item => {
  if (item.isTruncated) console.log(`"${item.text}" will be truncated`);
});
```

## Instructions

When using this library to size UI containers for Even Realities glasses:

1. **Always use this library** to predict text/list dimensions before creating containers. Do not guess pixel sizes.
2. **Line height is 27px** — multiply by line count for text container height.
3. **List items are 40px tall** — multiply by item count and add `2 * padding` for list container height.
4. **Max display is 576 x 288.** Ensure containers fit within these bounds.
5. When pairing with the glasses-ui skill, use `measureTextWrap` / `measureList` results to set container `width` and `height` properties precisely.

## Task

$ARGUMENTS
