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

## Event Types (OsEventTypeList enum)

| Value | Name | Description |
|-------|------|-------------|
| 0 | CLICK_EVENT | Single press (G2 or R1) |
| 1 | SCROLL_TOP_EVENT | Swipe up / scroll reaches top boundary |
| 2 | SCROLL_BOTTOM_EVENT | Swipe down / scroll reaches bottom boundary |
| 3 | DOUBLE_CLICK_EVENT | Double press (G2 or R1) |
| 4 | FOREGROUND_ENTER_EVENT | App comes to foreground |
| 5 | FOREGROUND_EXIT_EVENT | App goes to background |
| 6 | ABNORMAL_EXIT_EVENT | Unexpected disconnect |
| — | IMU_DATA_REPORT | IMU data sample |
| — | SYSTEM_EXIT_EVENT | System exit |

## Event Routing Rules

- Only the container with `isEventCapture: 1` receives events
- Text container with capture → events arrive as `event.textEvent`
- List container with capture → events arrive as `event.listEvent`
- Only one container per page can capture events

## Event Models

```typescript
interface Text_ItemEvent {
  containerID?: number
  containerName?: string
  eventType?: OsEventTypeList
}

interface List_ItemEvent {
  containerID?: number
  containerName?: string
  currentSelectItemName?: string
  currentSelectItemIndex?: number
  eventType?: OsEventTypeList
}

interface Sys_ItemEvent {
  eventType?: OsEventTypeList
  eventSource?: EventSourceType  // left/right arm, ring, etc.
  imuData?: IMU_Report_Data
  systemExitReasonCode?: number
}
```

## G2 vs R1 Distinction

G2 (temple touchpads) and R1 (ring touchpads) share the same gesture set — press, double press, swipe up, swipe down. To distinguish between them, check the `eventSource` field in `Sys_ItemEvent`. The `EventSourceType` value indicates whether the input came from the left arm, right arm, or ring accessory.

## Lifecycle Events

| Event | When it fires | Recommended action |
|-------|--------------|-------------------|
| FOREGROUND_ENTER_EVENT | App resumed / brought to foreground | Resume updates, refresh data |
| FOREGROUND_EXIT_EVENT | App backgrounded | Pause timers, stop ongoing work |
| ABNORMAL_EXIT_EVENT | Bluetooth connection lost unexpectedly | Clean up state, handle reconnection |

## Complete Event Handling Template

```typescript
import { waitForEvenAppBridge, OsEventTypeList } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

const unsubscribe = bridge.onEvenHubEvent(event => {
  const textEvent = event.textEvent
  if (textEvent) {
    switch (textEvent.eventType) {
      case OsEventTypeList.CLICK_EVENT:
      case undefined: // SDK normalizes 0 to undefined in some cases
        // Handle press
        break
      case OsEventTypeList.DOUBLE_CLICK_EVENT:
        // Handle double press
        break
      case OsEventTypeList.SCROLL_TOP_EVENT:
        // Handle swipe up
        break
      case OsEventTypeList.SCROLL_BOTTOM_EVENT:
        // Handle swipe down
        break
      case OsEventTypeList.FOREGROUND_ENTER_EVENT:
        // App resumed
        break
      case OsEventTypeList.FOREGROUND_EXIT_EVENT:
        // App backgrounded
        break
    }
  }

  if (event.listEvent) {
    console.log('Selected:', event.listEvent.currentSelectItemName)
    console.log('Index:', event.listEvent.currentSelectItemIndex)
  }

  if (event.sysEvent) {
    console.log('Event type:', event.sysEvent.eventType)
    console.log('Source:', event.sysEvent.eventSource)
  }
})

// Always clean up on teardown
// unsubscribe()
```

## Important Notes

**CLICK_EVENT normalization**: The SDK may normalize `CLICK_EVENT` (value `0`) to `undefined` in some cases. Always handle both `case OsEventTypeList.CLICK_EVENT:` and `case undefined:` in the same switch branch to ensure single-press events are never missed.

**Cleanup**: The `bridge.onEvenHubEvent()` call returns an `unsubscribe` function. Always call it on component teardown to prevent memory leaks. Failing to unsubscribe can cause stale event handlers to fire after your component is destroyed.

## Task

$ARGUMENTS
