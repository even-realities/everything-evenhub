---
name: handle-input
description: Handle user input and events in Even Hub G2 apps — touchpad gestures, ring input, scroll, foreground/background lifecycle, and event routing. Use when implementing user interaction or event handling.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [input handling task]
---

# Handle Input

Guide for handling user input, gestures, and lifecycle events in Even Hub G2 apps.

## Input Sources

| Source | Gestures | Notes |
|--------|----------|-------|
| G2 touchpads (temple) | Press, double press, swipe up, swipe down | Primary input |
| R1 touchpads (ring) | Press, double press, swipe up, swipe down | Optional accessory, same gesture set |
| IMU (accelerometer/gyroscope) | Head orientation, motion data | See device-features skill |

## Event Routing Rules

Events route differently depending on the **active container type** (the one with `isEventCapture: 1`). Only one container per page can capture events.

### Text container active

| Gesture | Event field | eventType |
|---------|-----------|-----------|
| Swipe up | `event.textEvent` | `1` (SCROLL_TOP_EVENT) |
| Swipe down | `event.textEvent` | `2` (SCROLL_BOTTOM_EVENT) |
| Single press | `event.sysEvent` | `undefined` / `0` |
| Double press | `event.sysEvent` | `3` (DOUBLE_CLICK_EVENT) |

**Key point**: clicks and double-clicks on text containers fire as `sysEvent`, NOT `textEvent`. Only scroll gestures fire as `textEvent`.

### List container active

| Gesture | Event field | Details |
|---------|-----------|---------|
| Swipe up/down | (internal) | SDK scrolls the list internally, no event fired |
| Single press | `event.listEvent` | `.currentSelectItemIndex` = selected item index |
| Double press | `event.sysEvent` | `.eventType` = `3` |

### System events (always available)

| Gesture | Event field | eventType |
|---------|-----------|-----------|
| Foreground enter | `event.sysEvent` | `4` (FOREGROUND_ENTER_EVENT) |
| Foreground exit | `event.sysEvent` | `5` (FOREGROUND_EXIT_EVENT) |
| Abnormal exit | `event.sysEvent` | `6` (ABNORMAL_EXIT_EVENT) |

## OsEventTypeList enum values

| Value | Name | Description |
|-------|------|-------------|
| 0 | CLICK_EVENT | Single press (G2 or R1) |
| 1 | SCROLL_TOP_EVENT | Swipe up |
| 2 | SCROLL_BOTTOM_EVENT | Swipe down |
| 3 | DOUBLE_CLICK_EVENT | Double press (G2 or R1) |
| 4 | FOREGROUND_ENTER_EVENT | App comes to foreground |
| 5 | FOREGROUND_EXIT_EVENT | App goes to background |
| 6 | ABNORMAL_EXIT_EVENT | Unexpected disconnect |
| 7 | SYSTEM_EXIT_EVENT | System-level exit |
| 8 | IMU_DATA_REPORT | IMU data sample |

## Event Models

```typescript
interface Text_ItemEvent {
  containerID?: number
  containerName?: string
  eventType?: number  // 1 = scroll up, 2 = scroll down
}

interface List_ItemEvent {
  containerID?: number
  containerName?: string
  currentSelectItemName?: string
  currentSelectItemIndex?: number  // 0-based; undefined when 0 (protobuf)
  eventType?: number
}

interface Sys_ItemEvent {
  eventType?: number    // undefined/0 = single click, 3 = double click
  eventSource?: number  // EventSourceType — left/right arm, ring, etc.
  imuData?: IMU_Report_Data
  systemExitReasonCode?: number
}
```

## Protobuf Zero-Value Omission

The SDK uses protobuf under the hood. **Any field with a zero/default value (0, false, empty string) will be `undefined`**, not the zero value. This affects:

- `sysEvent.eventType` — single click is `0`, but arrives as `undefined`
- `listEvent.currentSelectItemIndex` — first item is `0`, but arrives as `undefined`
- Any other numeric field with value `0`

**Always use nullish coalescing**: `event.sysEvent.eventType ?? 0`, `event.listEvent.currentSelectItemIndex ?? 0`.

## Complete Event Handling Template

```typescript
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

const unsubscribe = bridge.onEvenHubEvent(event => {
  if (event.listEvent) {
    // List item selected (single press on list container)
    const idx = event.listEvent.currentSelectItemIndex ?? 0
    console.log('Selected index:', idx)
    return
  }

  if (event.textEvent) {
    // Scroll on text container (NOT clicks — those come via sysEvent)
    const type = event.textEvent.eventType ?? 0
    if (type === 1) {
      // Swipe up / scroll up
    } else if (type === 2) {
      // Swipe down / scroll down
    }
    return
  }

  if (event.sysEvent) {
    const type = event.sysEvent.eventType ?? 0
    if (type === 0) {
      // Single press (on text container, or system-level)
    } else if (type === 3) {
      // Double press
    } else if (type === 4) {
      // App resumed (foreground enter)
    } else if (type === 5) {
      // App backgrounded (foreground exit)
    }
    return
  }
})

// Always clean up on teardown
// unsubscribe()
```

## G2 vs R1 Distinction

G2 (temple touchpads) and R1 (ring touchpads) share the same gesture set. To distinguish between them, check `eventSource` in `Sys_ItemEvent`. The `EventSourceType` value indicates whether input came from the left arm, right arm, or ring accessory.

## Exit Mechanism — Mandatory

Every app MUST provide a way to exit via glasses/ring interaction. Use the system-level exit confirmation — do NOT build custom exit dialogs.

**Recommended pattern — double-tap calls system popup:**

```typescript
function handleEvent(event: EvenHubEvent) {
  const type = event.sysEvent?.eventType ?? event.textEvent?.eventType ?? event.listEvent?.eventType
  const eventType = type ?? 0

  if (eventType === 3) { // DOUBLE_CLICK_EVENT
    // Save state, disable IMU, clean up
    flushState()
    bridge.imuControl(false).catch(() => {})
    unsubscribe()
    bridge.shutDownPageContainer(1)  // 1 = system confirmation popup
    return
  }
}
```

**`shutDownPageContainer` modes:**
- `shutDownPageContainer(0)` — immediate exit, no confirmation (use sparingly)
- `shutDownPageContainer(1)` — system-level "Exit?" popup on the glasses (recommended)

The system popup is the canonical pattern — it matches Even's native apps. Do not draw your own confirmation dialog; it adds complexity and the SDK provides this for free.

## Important Notes

- **Clicks on text containers route to `sysEvent`**, not `textEvent`. Only scroll gestures fire `textEvent`. This is the most common source of event-handling bugs.
- **Cleanup**: `bridge.onEvenHubEvent()` returns an unsubscribe function. Always call it on component teardown — including on exit events (ABNORMAL_EXIT, SYSTEM_EXIT).
- **One event listener per page**: Only the container with `isEventCapture: 1` receives input events. If multiple containers have `isEventCapture: 1`, the SDK rejects the page with a validation error.
- **Handle ALL lifecycle events**: FOREGROUND_ENTER (4) to re-render, FOREGROUND_EXIT (5) to save state, ABNORMAL_EXIT (6) and SYSTEM_EXIT (7) to clean up resources (disable IMU/audio, unsubscribe, flush state).

## Task

$ARGUMENTS
