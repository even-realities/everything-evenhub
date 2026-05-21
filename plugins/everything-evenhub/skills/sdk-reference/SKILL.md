---
name: sdk-reference
description: Complete Even Hub SDK API reference — all methods, types, interfaces, enums, and event models for G2 smart glasses development. Use when looking up specific API signatures, parameters, return types, or type definitions.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [API or type to look up]
---

You are the canonical SDK reference for the Even Hub G2 smart glasses SDK (`@evenrealities/even_hub_sdk`). When asked about `$ARGUMENTS`, locate and explain the relevant API, type, interface, enum, or method from this document. If no argument is given, provide a structured overview of all available APIs.

---

## Architecture

```
Web App (your code) <-> EvenAppBridge (SDK) <-> Even App (host) <-> G2 Glasses
```

Your app is a standard HTML + TypeScript web page running inside a Flutter WebView hosted by the Even companion app. No special framework is required — plain Vite + TypeScript works perfectly.

---

## Installation

```bash
npm install @evenrealities/even_hub_sdk
```

Current version: **0.0.10**

---

## Initialization

### `waitForEvenAppBridge()` — async, recommended

Resolves when the native bridge is ready. Always prefer this over the sync singleton.

```typescript
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()
```

### `EvenAppBridge.getInstance()` — sync singleton

Only call this after the bridge has already been initialized (e.g. inside a callback that fires after `waitForEvenAppBridge()` resolves).

```typescript
import { EvenAppBridge } from '@evenrealities/even_hub_sdk'

const bridge = EvenAppBridge.getInstance()
```

---

## Required Call Order

1. `waitForEvenAppBridge()` — wait for the bridge
2. `bridge.createStartUpPageContainer(container)` — call **exactly once** at startup
3. Everything else: `audioControl`, `imuControl`, `rebuildPageContainer`, event listeners, etc.

`audioControl` and `imuControl` will fail if `createStartUpPageContainer` has not succeeded first.

---

## Complete Method Reference

| Method | Returns | Description |
|---|---|---|
| `bridge.getUserInfo()` | `Promise<UserInfo>` | Get the signed-in user's uid, name, avatar URL, and country |
| `bridge.getDeviceInfo()` | `Promise<DeviceInfo \| null>` | Get connected glasses model, serial number, and status. Returns null if no device. |
| `bridge.setLocalStorage(key, value)` | `Promise<boolean>` | Persist a key-value string pair to the companion app's storage |
| `bridge.getLocalStorage(key)` | `Promise<string>` | Read a stored string by key; returns empty string if key does not exist |
| `bridge.createStartUpPageContainer(container)` | `Promise<StartUpPageCreateResult>` | One-shot startup call to define all UI containers. 0=success, 1=invalid, 2=oversize, 3=outOfMemory |
| `bridge.rebuildPageContainer(container)` | `Promise<boolean>` | Tear down and fully redraw all containers |
| `bridge.textContainerUpgrade(container)` | `Promise<boolean>` | In-place text update without full redraw (max 2000 chars per call) |
| `bridge.updateImageRawData(data)` | `Promise<ImageRawDataUpdateResult>` | Send raw pixel data to fill an image container. Calls must be serial — await each before the next. |
| `bridge.shutDownPageContainer(exitMode?)` | `Promise<boolean>` | Close the app. exitMode 0=exit immediately, 1=show confirmation dialog |
| `bridge.onLaunchSource(cb)` | `() => void` | Subscribe to launch source event. Fires exactly once: `'appMenu'` or `'glassesMenu'`. Returns unsubscribe function. |
| `bridge.onDeviceStatusChanged(cb)` | `() => void` | Subscribe to device status updates (connect type, battery, wearing, charging). Returns unsubscribe function. |
| `bridge.onEvenHubEvent(cb)` | `() => void` | Subscribe to all hub events: listEvent, textEvent, sysEvent, audioEvent. Returns unsubscribe function. |
| `bridge.audioControl(isOpen)` | `Promise<boolean>` | Open (`true`) or close (`false`) the microphone. Audio delivered as PCM via `audioEvent`. |
| `bridge.imuControl(isOpen, reportFrq?)` | `Promise<boolean>` | Enable/disable IMU sensor. `reportFrq` is an `ImuReportPace` value (P100–P1000). |
| `bridge.callEvenApp(method, params?)` | `Promise<any>` | Low-level direct call to native bridge method. Use when higher-level methods aren't available. |

---

## TypeScript Interfaces

### `TextContainerProperty`

Defines a text display container.

All fields are optional in the SDK constructor (accepts `Partial<T>`). Populate the fields your layout requires.

```typescript
class TextContainerProperty {
  xPosition?: number        // 0–576, horizontal offset from left edge
  yPosition?: number        // 0–288, vertical offset from top edge
  width?: number            // 0–576, container width
  height?: number           // 0–288, container height
  borderWidth?: number      // 0–5, border thickness in pixels
  borderColor?: number      // 0–15, greyscale colour index
  borderRadius?: number     // 0–10, corner radius
  paddingLength?: number    // 0–32, inner padding in pixels
  containerID?: number      // unique integer ID for this container
  containerName?: string    // max 16 characters
  isEventCapture?: number   // 0 or 1; exactly one container per page must be 1
  content?: string          // initial text content, max 1000 characters
}
```

### `ListContainerProperty`

Defines a scrollable list container.

```typescript
class ListContainerProperty {
  xPosition?: number        // 0–576
  yPosition?: number        // 0–288
  width?: number            // 0–576
  height?: number           // 0–288
  borderWidth?: number      // 0–5
  borderColor?: number      // 0–15
  borderRadius?: number     // 0–10
  paddingLength?: number    // 0–32
  containerID?: number
  containerName?: string    // max 16 characters
  isEventCapture?: number   // 0 or 1
  itemContainer?: ListItemContainerProperty
}
```

### `ListItemContainerProperty`

Defines the items within a list container.

```typescript
class ListItemContainerProperty {
  itemCount?: number        // 1–20, number of items
  itemWidth?: number        // item width; 0 = auto (fills container)
  isItemSelectBorderEn?: number  // 0 or 1; 1 = show selection border around highlighted item
  itemName?: string[]       // array of item label strings; max 20 items, max 64 chars each
}
```

### `ImageContainerProperty`

Defines a placeholder image container. Must be populated with `updateImageRawData` after creation. Image containers do not support `isEventCapture` — use a text container as the event-capture layer when combining with images.

```typescript
class ImageContainerProperty {
  xPosition?: number        // 0–576
  yPosition?: number        // 0–288
  width?: number            // 20–288
  height?: number           // 20–144
  containerID?: number
  containerName?: string    // max 16 characters
}
```

### `TextContainerUpgrade`

Payload for `bridge.textContainerUpgrade()`.

```typescript
class TextContainerUpgrade {
  containerID?: number
  containerName?: string    // max 16 characters
  contentOffset?: number    // character offset to begin writing
  contentLength?: number    // number of characters to replace
  content?: string          // replacement text, max 2000 characters total
}
```

### `ImageRawDataUpdate`

Payload for `bridge.updateImageRawData()`.

```typescript
class ImageRawDataUpdate {
  containerID?: number
  containerName?: string
  imageData?: number[] | string | Uint8Array | ArrayBuffer  // raw pixel data in 4-bit greyscale
}
```

### `CreateStartUpPageContainer`

Parameter type for `bridge.createStartUpPageContainer()`.

```typescript
class CreateStartUpPageContainer {
  containerTotalNum?: number                    // 1–12, total number of containers
  widgetId?: number                             // auto-assigned; omit to let SDK assign
  listObject?: ListContainerProperty[]          // list containers
  textObject?: TextContainerProperty[]          // text containers, max 8
  imageObject?: ImageContainerProperty[]        // image containers, max 4
}
```

### `RebuildPageContainer`

Parameter type for `bridge.rebuildPageContainer()`. Same shape as `CreateStartUpPageContainer` but without `widgetId`.

```typescript
class RebuildPageContainer {
  containerTotalNum?: number                    // 1–12, total number of containers
  listObject?: ListContainerProperty[]          // list containers
  textObject?: TextContainerProperty[]          // text containers, max 8
  imageObject?: ImageContainerProperty[]        // image containers, max 4
}
```

### `UserInfo`

```typescript
interface UserInfo {
  uid: number              // numeric user ID
  name: string             // display name
  avatar: string           // URL to avatar image
  country: string          // ISO country code or name
}
```

### `DeviceInfo`

```typescript
interface DeviceInfo {
  readonly model: DeviceModel    // glasses model identifier
  readonly sn: string            // serial number
  status: DeviceStatus           // current connection status object
}
```

### `DeviceStatus`

```typescript
interface DeviceStatus {
  sn: string
  connectType: DeviceConnectType
  isWearing?: boolean            // true if glasses are being worn
  batteryLevel?: number          // 0–100, battery percentage
  isCharging?: boolean           // true if glasses are charging
  isInCase?: boolean             // true if glasses are in the charging case

  // Instance helpers
  isNone(): boolean
  isConnected(): boolean
  isConnecting(): boolean
  isDisconnected(): boolean
  isConnectionFailed(): boolean

  // Static factory methods
  static fromJson(json: Record<string, any>): DeviceStatus
  static createDefault(sn?: string): DeviceStatus
}
```

---

## Event Models

### `EvenHubEvent`

The callback type for `bridge.onEvenHubEvent(cb)`.

```typescript
interface EvenHubEvent {
  listEvent?: List_ItemEvent
  textEvent?: Text_ItemEvent
  sysEvent?: Sys_ItemEvent
  audioEvent?: { audioPcm: Uint8Array }
  jsonData?: Record<string, any>     // raw payload passthrough
}
```

### `Text_ItemEvent`

Fires when a text container receives a user interaction.

```typescript
interface Text_ItemEvent {
  containerID?: number
  containerName?: string
  eventType?: OsEventTypeList
}
```

### `List_ItemEvent`

Fires when a list item is selected or scrolled.

```typescript
interface List_ItemEvent {
  containerID?: number
  containerName?: string
  currentSelectItemName?: string     // label of the currently selected item
  currentSelectItemIndex?: number    // 0-based index of the selected item
  eventType?: OsEventTypeList
}
```

### `Sys_ItemEvent`

System-level events including IMU data and lifecycle signals.

```typescript
interface Sys_ItemEvent {
  eventType?: OsEventTypeList
  eventSource?: EventSourceType
  imuData?: IMU_Report_Data
  systemExitReasonCode?: number
}
```

### `IMU_Report_Data`

Raw accelerometer/gyro values from the glasses' IMU sensor.

```typescript
interface IMU_Report_Data {
  x?: number    // X-axis value
  y?: number    // Y-axis value
  z?: number    // Z-axis value
}
```

### `LaunchSource`

```typescript
type LaunchSource = 'appMenu' | 'glassesMenu'
```

---

## Enums

```typescript
enum OsEventTypeList {
  CLICK_EVENT = 0,
  SCROLL_TOP_EVENT = 1,
  SCROLL_BOTTOM_EVENT = 2,
  DOUBLE_CLICK_EVENT = 3,
  FOREGROUND_ENTER_EVENT = 4,
  FOREGROUND_EXIT_EVENT = 5,
  ABNORMAL_EXIT_EVENT = 6,
  SYSTEM_EXIT_EVENT = 7,
  IMU_DATA_REPORT = 8
}

enum DeviceConnectType {
  None = 'none',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  ConnectionFailed = 'connectionFailed'
}

enum StartUpPageCreateResult {
  success = 0,
  invalid = 1,
  oversize = 2,
  outOfMemory = 3
}

enum ImageRawDataUpdateResult {
  success = "success",
  imageException = "imageException",
  imageSizeInvalid = "imageSizeInvalid",
  imageToGray4Failed = "imageToGray4Failed",
  sendFailed = "sendFailed"
}

enum EvenAppMethod {
  GetUserInfo = 'getUserInfo',
  GetGlassesInfo = 'getGlassesInfo',
  SetLocalStorage = 'setLocalStorage',
  GetLocalStorage = 'getLocalStorage',
  CreateStartUpPageContainer = 'createStartUpPageContainer',
  RebuildPageContainer = 'rebuildPageContainer',
  UpdateImageRawData = 'updateImageRawData',
  TextContainerUpgrade = 'textContainerUpgrade',
  AudioControl = 'audioControl',
  ImuControl = 'imuControl',
  ShutDownPageContainer = 'shutDownPageContainer'
}

// ImuReportPace — reporting frequency for IMU sensor data
// Value = milliseconds between reports (P100 = 100 ms = 10 Hz, P1000 = 1000 ms = 1 Hz)
enum ImuReportPace {
  P100 = 100,
  P200 = 200,
  P300 = 300,
  P400 = 400,
  P500 = 500,
  P600 = 600,
  P700 = 700,
  P800 = 800,
  P900 = 900,
  P1000 = 1000
}

enum EventSourceType {
  TOUCH_EVENT_FORM_DUMMY_NULL = 0,
  TOUCH_EVENT_FROM_GLASSES_R = 1,
  TOUCH_EVENT_FROM_RING = 2,
  TOUCH_EVENT_FROM_GLASSES_L = 3
}

enum DeviceModel {
  G1 = 'g1',
  G2 = 'g2',
  Ring1 = 'ring1'
}
```

---

## Result Codes

### `createStartUpPageContainer` / `StartUpPageCreateResult`

| Code | Name | Meaning |
|---|---|---|
| 0 | success | Containers created successfully |
| 1 | invalid | Invalid container configuration |
| 2 | oversize | Total container size exceeds display limits |
| 3 | outOfMemory | Insufficient memory on device |

### `updateImageRawData` / `ImageRawDataUpdateResult`

| Name | Meaning |
|---|---|
| success | Image data accepted and rendered |
| imageException | Generic image processing error |
| imageSizeInvalid | Image dimensions do not match container dimensions |
| imageToGray4Failed | Could not convert image to 4-bit greyscale |
| sendFailed | Transport error sending data to glasses |

---

## Critical Rules

1. **`createStartUpPageContainer` is one-shot** — call it exactly once at startup; calling it again will not work. Use `rebuildPageContainer` for subsequent full redraws.
2. **Exactly one container must have `isEventCapture: 1`** — this designates which container receives user input. Having zero or more than one causes undefined behavior.
3. **Container limits** — `containerTotalNum` must be 1–12; `textObject` array max 8 items; `imageObject` array max 4 items.
4. **Image sends must be serial** — `updateImageRawData` calls must be queued and awaited one at a time; concurrent calls are not supported and will cause errors.
5. **Image containers are placeholders** — after `createStartUpPageContainer` succeeds, image containers are empty until populated via `updateImageRawData`.
6. **`audioControl` and `imuControl` require startup to succeed** — these will fail if called before `createStartUpPageContainer` returns `StartUpPageCreateResult.success`.
7. **Always unsubscribe event listeners on teardown** — `onEvenHubEvent`, `onDeviceStatusChanged`, and `onLaunchSource` all return an unsubscribe function; call it when your component/page is destroyed.
8. **`onLaunchSource` fires only once** — register the listener early (before or immediately after `waitForEvenAppBridge`) to avoid missing the event.

---

## Canvas Specifications

| Property | Value |
|---|---|
| Resolution | 576 × 288 px |
| Colour depth | 4-bit greyscale (16 shades, 0 = black, 15 = white) |
| Coordinate origin | (0, 0) at top-left |
| X axis | Increases rightward |
| Y axis | Increases downward |

---

## Host Push Format (Simulator / Testing)

The companion app (and simulator) push events into the WebView via `window.postMessage`. You generally do not need to handle these directly — the SDK processes them internally — but the formats are useful when writing tests or a custom simulator.

```javascript
// Format 1 — named event type with jsonData wrapper
{ type: 'listen_even_app_data', method: 'evenHubEvent', data: { type: 'listEvent', jsonData: { /* event payload */ } } }

// Format 2 — snake_case event type with data wrapper
{ type: 'listen_even_app_data', method: 'evenHubEvent', data: { type: 'list_event', data: { /* event payload */ } } }

// Format 3 — array format [eventType, payload]
{ type: 'listen_even_app_data', method: 'evenHubEvent', data: ['list_event', { /* event payload */ }] }

// Audio event — audioPcm is an array of PCM sample integers
{ type: 'listen_even_app_data', method: 'evenHubEvent', data: { type: 'audioEvent', jsonData: { audioPcm: [/* numbers */] } } }

// Device status changed
{ type: 'listen_even_app_data', method: 'deviceStatusChanged', data: { sn: 'ABC123', connectType: 'connected', isWearing: true, batteryLevel: 80, isCharging: false } }

// Launch source (fires once on app open)
{ method: 'evenAppLaunchSource', data: { launchSource: 'appMenu' } }
```

---

## Task

Look up SDK reference for: $ARGUMENTS
