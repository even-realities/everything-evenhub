---
name: device-features
description: Use G2 hardware features in Even Hub apps — microphone audio capture (glasses or phone mic), IMU motion data, location (one-shot and continuous), phone album picker / camera capture, device info, user info, and local storage. Use when working with audio, IMU, location, photos, battery, wearing detection, or persistent storage.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [feature task description]
---

You are implementing G2 hardware feature integration for an Even Hub app. Use the reference below to implement exactly what `$ARGUMENTS` describes.

## Prerequisite

`createStartUpPageContainer` must succeed before calling `imuControl` or `audioControl(true, AudioInputSource.Glasses)` — both depend on the glasses-side startup page being established first. **Phone-mic audio, location APIs, `pickImageFromAlbum`, and `captureImageFromCamera` do NOT require the startup page** — they route through the phone, not the glasses.

---

## Audio Capture

Start the microphone with `await bridge.audioControl(true, source)` and stop it with `await bridge.audioControl(false)`. The `source` argument picks which mic to capture from:

- `AudioInputSource.Glasses` — G2 four-mic array (default; requires `createStartUpPageContainer` first)
- `AudioInputSource.Phone` — phone microphone (no startup-page requirement)

Omit the second argument and the SDK defaults to `AudioInputSource.Glasses` (backward-compat with pre-0.0.11 code).

Audio data arrives through the `onEvenHubEvent` listener. Access it via `event.audioEvent`, which carries `source` (the mic the buffer came from) and `audioPcm` (a `Uint8Array`).

**Format on both sources:** PCM, 16 kHz sample rate, signed 16-bit little-endian, mono channel.

```typescript
import { AudioInputSource } from '@evenrealities/even_hub_sdk'

// Glasses MIC — requires createStartUpPageContainer to have succeeded
await bridge.audioControl(true, AudioInputSource.Glasses)

// Phone MIC — no startup-page requirement
// await bridge.audioControl(true, AudioInputSource.Phone)

const unsubscribe = bridge.onEvenHubEvent(event => {
  const audio = event.audioEvent
  if (!audio) return
  // audio.source: AudioInputSource.Glasses | AudioInputSource.Phone
  // audio.audioPcm: Uint8Array
  // Process PCM (Web Audio API, speech recognition, etc.)
})

// Stop and clean up
await bridge.audioControl(false)
unsubscribe()
```

**Permissions:** declare `g2-microphone` for `AudioInputSource.Glasses` and `phone-microphone` for `AudioInputSource.Phone` in `app.json`. Declare only the source(s) the app actually uses.

---

## IMU Control

Start IMU reporting with `await bridge.imuControl(true, ImuReportPace.P500)` and stop with `await bridge.imuControl(false)`.

**ImuReportPace enum values:** P100, P200, P300, P400, P500, P600, P700, P800, P900, P1000. These are protocol pacing codes, not literal Hz values.

IMU data arrives via `onEvenHubEvent`. Access it through `event.sysEvent.imuData`, which has the shape `{ x: float, y: float, z: float }`. Filter events by checking `sys.eventType === OsEventTypeList.IMU_DATA_REPORT`.

```typescript
import { ImuReportPace, OsEventTypeList } from '@evenrealities/even_hub_sdk'

await bridge.imuControl(true, ImuReportPace.P500)

const unsubscribe = bridge.onEvenHubEvent(event => {
  const sys = event.sysEvent
  if (!sys?.imuData) return
  if (sys.eventType !== OsEventTypeList.IMU_DATA_REPORT) return
  const { x, y, z } = sys.imuData
  console.log('IMU:', x, y, z)
})

await bridge.imuControl(false)
unsubscribe()
```

---

## Location

Two modes — one-shot reads and continuous updates. Both read from the **phone's** location services; declare `location` in `app.json` permissions before calling. No `createStartUpPageContainer` requirement.

### One-shot — `getAppLocation(options?)`

```typescript
import { AppLocationAccuracy } from '@evenrealities/even_hub_sdk'

const fix = await bridge.getAppLocation({
  accuracy: AppLocationAccuracy.High,
  timeoutMs: 5000,
})

if (fix) {
  console.log(fix.latitude, fix.longitude)
} else {
  // No fix in time, permission denied, or invalid coords. Handle gracefully.
}
```

Returns `AppLocation | null`. Always null-check — the host returns `null` when it has no fix in time, the user denied permission, or the coordinates are invalid.

### Continuous — `startAppLocationUpdates(options?)` + `onAppLocationChanged(cb)`

```typescript
await bridge.startAppLocationUpdates({
  accuracy: AppLocationAccuracy.Medium,
  intervalMs: 1000,
  distanceFilter: 5,  // meters — host skips pushes smaller than this
})

const unsubscribe = bridge.onAppLocationChanged(loc => {
  console.log(loc.latitude, loc.longitude, loc.speed)
})

// Stop and clean up
await bridge.stopAppLocationUpdates()
unsubscribe()
```

### `AppLocationAccuracy` values

- `AppLocationAccuracy.Low` — city-level; cheapest, kindest to battery
- `AppLocationAccuracy.Medium` — block-level; balanced default
- `AppLocationAccuracy.High` — best available fix; most battery

### `AppLocation` shape

- `latitude` — number, degrees
- `longitude` — number, degrees
- `accuracy?` — number, horizontal accuracy in meters
- `altitude?` — number, meters above sea level
- `speed?` — number, meters per second
- `heading?` — number, degrees from true north
- `timestamp?` — number, Unix milliseconds

### `AppLocationOptions` fields (all optional)

- `accuracy` — `AppLocationAccuracy`
- `timeoutMs` — one-shot only; max wait for a fix
- `intervalMs` — continuous only; requested push cadence
- `distanceFilter` — continuous only; meters

### Background behaviour

`startAppLocationUpdates` is stopped when the WebView is suspended on Android (see `background-state`). Re-arm on foreground; cached fixes from `bridge.setLocalStorage` are fine to render while you wait.

---

## Photos

Two ways to bring an image into the app from the **phone** — pick from album or capture from the phone camera. Both are single-shot, return one `AppImageAsset`, and use phone hardware. **The G2 has no on-glasses camera.**

```typescript
const fromAlbum = await bridge.pickImageFromAlbum()      // requires `album` permission
const fromCamera = await bridge.captureImageFromCamera() // requires `camera` permission

if (fromAlbum) {
  // fromAlbum.base64 is ready to drop into an <img src="data:...">
}
```

Both return `null` when the user cancels the picker / camera or denies permission. The album picker is **single-select only** — no multi-import.

### `AppImageAsset` shape

- `path` — string, host-side path (opaque to the WebView)
- `name` — string, original filename
- `mimeType` — string, e.g. `image/jpeg`, `image/png`
- `size` — number, bytes
- `base64` — string, inline data ready for `<img>` or further processing

### Sending the image to the glasses

`base64` is ready to display in the WebView immediately, but pumping a 12-megapixel JPEG into a glasses container via `updateImageRawData` is expensive. **Downscale and convert to 4-bit greyscale before sending pixels to the glasses.** See `glasses-ui` for image-container patterns.

---

## Device Info

`await bridge.getDeviceInfo()` returns a `DeviceInfo` object or `null`.

**DeviceInfo fields:**
- `model` — `DeviceModel` enum (`DeviceModel.G1 = "g1"`, `DeviceModel.G2 = "g2"`, `DeviceModel.Ring1 = "ring1"`)
- `sn` — serial number string
- `status` — a `DeviceStatus` object

**DeviceStatus interface fields:**
- `sn` — serial number
- `connectType` — a `DeviceConnectType` enum value
- `isWearing?` — boolean, whether the user is wearing the device
- `batteryLevel?` — integer 0–100
- `isCharging?` — boolean
- `isInCase?` — boolean

**DeviceConnectType enum values:** None, Connecting, Connected, Disconnected, ConnectionFailed

**DeviceStatus helper methods:** `isNone()`, `isConnected()`, `isConnecting()`, `isDisconnected()`, `isConnectionFailed()`

For real-time status updates, subscribe with `bridge.onDeviceStatusChanged`:

```typescript
const unsubscribe = bridge.onDeviceStatusChanged(status => {
  console.log('Battery:', status.batteryLevel)
  console.log('Connected:', status.isConnected())
})
```

Call `unsubscribe()` to stop listening.

---

## User Info

`await bridge.getUserInfo()` returns a `UserInfo` object.

**UserInfo fields:**
- `uid` — number, unique user identifier
- `name` — string, display name
- `avatar` — string, URL to the user's avatar image
- `country` — string, user's country code

---

## Local Storage

Persist data to the Even Realities App (survives app restarts):

- `await bridge.setLocalStorage(key, value)` — stores a string value; returns `boolean` indicating success
- `await bridge.getLocalStorage(key)` — retrieves a stored string; returns an empty string if the key does not exist

### SDK localStorage is the only reliable persistence

The Even App WebView is a Flutter WebView. **Browser IndexedDB and browser `localStorage` do NOT reliably persist across app restarts** in this environment — data saved there can be lost when the user closes and reopens the app.

Use `bridge.setLocalStorage` / `bridge.getLocalStorage` for all user state: settings, progress, bookmarks, preferences, cached content. For large content (e.g. ebook text), chunk it across multiple keys:

```typescript
const CHUNK_SIZE = 50_000  // chars per key
const PREFIX = 'myapp.content_'

async function saveContent(bridge: EvenAppBridge, id: string, text: string) {
  const chunks = Math.ceil(text.length / CHUNK_SIZE)
  await bridge.setLocalStorage(`${PREFIX}${id}_n`, String(chunks))
  for (let i = 0; i < chunks; i++) {
    await bridge.setLocalStorage(
      `${PREFIX}${id}_${i}`,
      text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    )
  }
}
```

See `glasses-ui` → Best Practices for debouncing and serializing bridge writes.

---

## Cleanup on Exit

Always stop hardware features and unsubscribe event listeners when the app exits or is destroyed. Failing to do so may leave the microphone or IMU running on the glasses hardware.

```typescript
// Store all unsubscribe functions and stop hardware on exit
window.addEventListener('beforeunload', () => {
  bridge.audioControl(false)
  bridge.imuControl(false)
  bridge.stopAppLocationUpdates()
  unsubscribe() // from onEvenHubEvent
  unsubscribeLocation() // from onAppLocationChanged
})
```

Apply the same pattern for any hardware feature that requires explicit stop/start control (`audioControl`, `imuControl`, `startAppLocationUpdates`).

---

## What the SDK Does NOT Expose

The following capabilities are not available through the Even Hub SDK:

- No direct Bluetooth access
- No arbitrary pixel drawing
- No audio output (there is no speaker)
- No text alignment control
- No font control
- No background colors
- No per-item list styling
- No programmatic scroll position
- No animations
- No glasses-side camera (the G2 has none — the phone camera is reachable via `captureImageFromCamera`, see Photos above)
- Images are greyscale only

---

## Task

$ARGUMENTS
