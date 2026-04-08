---
name: glasses-ui
description: Build glasses display UI for Even Hub G2 apps — text containers, lists, images, page lifecycle, and layout patterns on the 576x288 canvas. Use when creating or updating glasses display content.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [UI task description]
---

## Canvas

The G2 glasses display is a **576x288 px** canvas with the following characteristics:

- **Origin**: top-left corner (0, 0)
- **X axis**: increases rightward (0 to 576)
- **Y axis**: increases downward (0 to 288)
- **Color depth**: 4-bit greyscale — 16 shades of green (values 0–15)
- **White pixels** appear as bright green on hardware
- **Black pixels** are off (transparent — show through to the real world)
- **No background color or fill** — the canvas has no default background; unpainted areas are transparent

## Container Rules

Every page is composed of containers. The following limits apply per page:

- **Maximum 12 containers total** (combined across all types)
- **Maximum 8 text/list containers**
- **Maximum 4 image containers**
- **Exactly one container must have `isEventCapture: 1`** — this container receives user input events
- **No z-index control** — declaration order determines overlap (later declarations render on top)
- **`containerID`** must be unique per page (number)
- **`containerName`** must be unique per page (string, max 16 characters)

## Shared Properties

All container types share these properties:

| Property | Type | Range | Notes |
|---|---|---|---|
| `xPosition` | number | 0–576 | Left edge of container |
| `yPosition` | number | 0–288 | Top edge of container |
| `width` | number | 0–576 | Container width in pixels |
| `height` | number | 0–288 | Container height in pixels |
| `containerID` | number | — | Unique per page |
| `containerName` | string | max 16 chars | Unique per page |
| `isEventCapture` | number | 0 or 1 | Exactly one container must be 1 |

## Border Properties

Border properties apply to **text and list containers** only (not image containers):

| Property | Type | Range | Notes |
|---|---|---|---|
| `borderWidth` | number | 0–5 | 0 = no border |
| `borderColor` | number | 0–15 | Greyscale level (0 = black, 15 = white/bright green) |
| `borderRadius` | number | 0–10 | Rounded corner radius |
| `paddingLength` | number | 0–32 | Uniform padding applied to all sides |

## TextContainerProperty

Text containers display scrollable or static text content.

| Property | Type | Range | Notes |
|---|---|---|---|
| `xPosition` | number | 0–576 | Left edge |
| `yPosition` | number | 0–288 | Top edge |
| `width` | number | 0–576 | Container width |
| `height` | number | 0–288 | Container height |
| `containerID` | number | — | Unique per page |
| `containerName` | string | max 16 chars | Unique per page |
| `isEventCapture` | number | 0 or 1 | Exactly one must be 1 |
| `borderWidth` | number | 0–5 | 0 = no border |
| `borderColor` | number | 0–15 | Greyscale level |
| `borderRadius` | number | 0–10 | Rounded corners |
| `paddingLength` | number | 0–32 | Uniform padding |
| `content` | string | — | Text to display |

**Content limits:**
- `createStartUpPageContainer`: max **1000 characters**
- `textContainerUpgrade`: max **2000 characters**
- `rebuildPageContainer`: max **1000 characters**

**Text behavior:**
- Text wraps automatically at container width
- Use `\n` for explicit line breaks
- Approximately **400–500 characters fill the full screen**
- Unicode is supported within the firmware font set
- No text alignment options (always left-aligned)
- No font size control
- No bold or italic styling

## ListContainerProperty and ListItemContainerProperty

List containers display a scrollable list of selectable items managed by the native firmware.

**ListItemContainerProperty** defines the list items:

| Property | Type | Range | Notes |
|---|---|---|---|
| `itemCount` | number | 1–20 | Number of items in the list |
| `itemWidth` | number | 0–576 | Item width; 0 = auto fill container width |
| `isItemSelectBorderEn` | number | 0 or 1 | Enable selection border highlight |
| `itemName` | string[] | max 20 items, max 64 chars each | Array of item label strings |

**List container behavior:**
- Firmware handles scroll natively — no manual scroll implementation needed
- Lists **cannot be updated in-place** — the entire page must be rebuilt to change list content
- No custom styling per item
- No item height control
- No separator lines between items

## ImageContainerProperty

Image containers render 4-bit greyscale bitmap images.

| Property | Type | Range | Notes |
|---|---|---|---|
| `xPosition` | number | 0–576 | Left edge |
| `yPosition` | number | 0–288 | Top edge |
| `width` | number | 20–200 | Container width in pixels |
| `height` | number | 20–100 | Container height in pixels |
| `containerID` | number | — | Unique per page |
| `containerName` | string | max 16 chars | Unique per page |
| `isEventCapture` | number | 0 or 1 | Exactly one must be 1 |

**Image data format:**
- Accepts: `number[] | Uint8Array | ArrayBuffer | base64` string
- Color depth: 4-bit greyscale (values 0–15 per pixel)

**Critical behavior:**
- Image containers are **placeholders on creation** — they display nothing until `updateImageRawData` is called
- **Always call `updateImageRawData` after creating an image container** to display content
- **Do not send image data concurrently** — queue image updates and wait for each to complete before sending the next

## Page Lifecycle Methods

### `createStartUpPageContainer(pageIndex, containers)`

Called once at app startup to create the initial page layout.

```typescript
createStartUpPageContainer(pageIndex: number, containers: {
  containerTotalNum: number
  textObject?: TextContainerProperty[]
  imageObject?: ImageContainerProperty[]
  listObject?: ListContainerProperty[]
}): Promise<number>
```

Return codes:
- `0` — success
- `1` — invalid parameters
- `2` — oversize (content too large)
- `3` — out of memory

### `rebuildPageContainer(pageIndex, containers)`

Fully redraws a page. Use when changing layout structure (adding/removing containers, switching container types).

```typescript
rebuildPageContainer(pageIndex: number, containers: {
  containerTotalNum: number
  textObject?: TextContainerProperty[]
  imageObject?: ImageContainerProperty[]
  listObject?: ListContainerProperty[]
}): Promise<boolean>
```

- Returns `true` on success
- Causes a **brief flicker on hardware** (full redraw)
- Text content limit: 1000 characters per text container

### `textContainerUpgrade(containerID, containerName, content, contentOffset, contentLength)`

Updates text content in-place without rebuilding the page. Flicker-free.

```typescript
textContainerUpgrade(
  containerID: number,
  containerName: string,
  content: string,
  contentOffset: number,
  contentLength: number
): Promise<boolean>
```

- Returns `true` on success
- **No flicker** — updates only the target text container
- `containerID` and `containerName` must **exactly match** the existing container
- Text content limit: 2000 characters
- Use `contentOffset: 0, contentLength: 0` for full content replacement

### `updateImageRawData({ containerID, containerName, imageData })`

Sends pixel data to an image container.

```typescript
updateImageRawData(params: {
  containerID: number
  containerName: string
  imageData: number[] | Uint8Array | ArrayBuffer | string
}): Promise<string>
```

Return status strings:
- `'success'` — image displayed
- `'imageException'` — general image error
- `'imageSizeInvalid'` — image dimensions do not match container
- `'imageToGray4Failed'` — color conversion failed
- `'sendFailed'` — transmission error

**Do not call concurrently** — wait for the previous call to resolve before sending another image.

### `shutDownPageContainer(type)`

Exits the current page.

```typescript
shutDownPageContainer(type: number): Promise<boolean>
```

- `type: 0` — immediate exit with no confirmation
- `type: 1` — show exit confirmation dialog

## Best Practices

- **Use `textContainerUpgrade` for frequent updates** (counters, status lines, live data feeds) — it updates in-place with no flicker
- **Use `rebuildPageContainer` when changing layout** — adding or removing containers, switching container types, or updating list items
- **Always match `containerID` and `containerName` exactly** when calling `textContainerUpgrade` — mismatches silently fail
- **Do not call `updateImageRawData` concurrently** — queue updates and await each before sending the next
- **Pre-paginate long text** at ~400–500 character boundaries and use `rebuildPageContainer` on scroll events

## Render Queue — Prevent Concurrent Bridge Calls

Bridge calls go over BLE to the glasses. Sending multiple calls concurrently crashes the glasses or causes undefined behavior. **Serialize all bridge render calls through a queue.**

Additionally, a single BLE call can hang for ~30 seconds if the connection is flaky. Without a timeout, this blocks the entire render pipeline. Use `Promise.race` to cap each call.

```typescript
let renderInFlight = false
let pendingRender: (() => Promise<void>) | null = null
const RENDER_TIMEOUT_MS = 4000

async function enqueueRender(fn: () => Promise<void>) {
  if (renderInFlight) {
    pendingRender = fn  // only keep latest — drop intermediate
    return
  }
  renderInFlight = true
  try {
    await Promise.race([
      fn(),
      new Promise<void>((_, rej) =>
        setTimeout(() => rej(new Error('render timeout')), RENDER_TIMEOUT_MS)
      ),
    ])
  } catch {
    // Timeout or bridge error — drop it, next call will retry
  } finally {
    renderInFlight = false
    if (pendingRender) {
      const next = pendingRender
      pendingRender = null
      await enqueueRender(next)
    }
  }
}
```

## Startup Page Tracking — Critical

`createStartUpPageContainer` must be called **exactly once**. All subsequent page changes must use `rebuildPageContainer`. Calling `createStartUpPageContainer` repeatedly floods the bridge and crashes the glasses.

**Warning:** Do NOT check the return value to decide whether startup succeeded. The SDK documentation says it returns `0` on success, but in practice it may return the string `'success'`. Gating on `result === 0` silently fails, causing every render to re-call `createStartUpPageContainer`.

```typescript
let startupRendered = false

async function renderPage(bridge: EvenAppBridge, config: any) {
  await enqueueRender(async () => {
    if (!startupRendered) {
      startupRendered = true  // set BEFORE the call
      try {
        await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(config))
      } catch (err) {
        startupRendered = false  // allow retry on failure
        throw err
      }
    } else {
      await bridge.rebuildPageContainer(new RebuildPageContainer(config))
    }
  })
}
```

## Atomic Multi-Container Updates

When updating multiple text containers (e.g., a reader + status bar), update them in a single enqueued batch. If you enqueue them separately, the render queue drops intermediate pending renders, causing desync.

```typescript
async function updateTextBatch(
  bridge: EvenAppBridge,
  updates: Array<{ containerID: number; containerName: string; content: string }>,
) {
  await enqueueRender(async () => {
    for (const u of updates) {
      await bridge.textContainerUpgrade(new TextContainerUpgrade({
        containerID: u.containerID,
        containerName: u.containerName,
        contentOffset: 0,
        contentLength: 2000,
        content: u.content,
      }))
    }
  })
}
```

## Common UI Patterns

### Fake buttons

Prefix text items with `>` as a cursor indicator to simulate a button or selection state:

```
> Start
  Settings
  Exit
```

### Selection highlight

Toggle `borderWidth` on individual text containers between 0 (unselected) and a nonzero value (selected) to indicate focus. Requires `rebuildPageContainer`.

### Multi-row layout

Stack multiple text containers vertically. For three equal rows on a 288px canvas:

```typescript
// Row 1: y=0,   height=96
// Row 2: y=96,  height=96
// Row 3: y=192, height=96
```

### Progress bars

Use Unicode block characters to draw progress bars within a text container:

```typescript
const filled = Math.round((progress / 100) * barWidth)
const bar = '━'.repeat(filled) + '─'.repeat(barWidth - filled)
content = `Progress: ${bar} ${progress}%`
```

### Page flipping

Pre-paginate content at ~400–500 character boundaries. On scroll/navigation events, call `rebuildPageContainer` with the new page slice:

```typescript
const pages = paginateText(fullText, 450)
let currentPage = 0

async function showPage(index: number) {
  currentPage = index
  await bridge.rebuildPageContainer({
    containerTotalNum: 1,
    textObject: [{ ...containerConfig, content: pages[index] }],
  })
}
```

## Complete Code Example

```typescript
import {
  waitForEvenAppBridge,
  type TextContainerProperty,
  type ImageContainerProperty,
} from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

// Create initial page with text and image containers
const textContainer: TextContainerProperty = {
  xPosition: 0, yPosition: 0, width: 576, height: 200,
  borderWidth: 0, borderColor: 5, paddingLength: 4,
  containerID: 1, containerName: 'main',
  content: 'Hello from G2!',
  isEventCapture: 1,
}

const imageContainer: ImageContainerProperty = {
  xPosition: 200, yPosition: 210, width: 100, height: 60,
  containerID: 2, containerName: 'icon',
}

const result = await bridge.createStartUpPageContainer({
  containerTotalNum: 2,
  textObject: [textContainer],
  imageObject: [imageContainer],
})

if (result === 0) {
  // Update image content after creation
  await bridge.updateImageRawData({
    containerID: 2,
    containerName: 'icon',
    imageData: [/* pixel data */],
  })

  // Flicker-free text update
  await bridge.textContainerUpgrade({
    containerID: 1,
    containerName: 'main',
    content: 'Updated text!',
    contentOffset: 0,
    contentLength: 0,
  })
}
```

## Image-Based App Pattern

When building an image-first app (e.g., rendering a canvas or bitmap as the primary display), use a full-screen text container as the event capture layer behind the image container:

```typescript
// Full-screen transparent text container — receives events, invisible to user
const eventLayer: TextContainerProperty = {
  xPosition: 0, yPosition: 0, width: 576, height: 288,
  containerID: 1, containerName: 'eventLayer',
  content: ' ',        // single space — required, cannot be empty
  isEventCapture: 1,   // this layer catches all input events
  borderWidth: 0, borderColor: 0, paddingLength: 0,
}

// Image container renders on top of the event layer
const imageLayer: ImageContainerProperty = {
  xPosition: 0, yPosition: 0, width: 200, height: 100,
  containerID: 2, containerName: 'display',
  // isEventCapture: 0 (default) — image containers do not capture events
}

await bridge.createStartUpPageContainer({
  containerTotalNum: 2,
  textObject: [eventLayer],
  imageObject: [imageLayer],
})

// Always send image data after creation
await bridge.updateImageRawData({
  containerID: 2,
  containerName: 'display',
  imageData: pixelData,
})
```

The text container receives events; the image container draws on top.

## Task

$ARGUMENTS
