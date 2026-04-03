---
name: device-features
description: Use G2 hardware features in Even Hub apps — microphone audio capture, IMU motion data, device info, user info, and local storage. Use when working with audio, IMU, battery, wearing detection, or persistent storage.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [feature task description]
---

You are implementing G2 hardware feature integration for an Even Hub app. Use the reference below to implement exactly what `$ARGUMENTS` describes.

## Prerequisite

`createStartUpPageContainer` must succeed before calling `audioControl` or `imuControl`. Both features depend on the startup page container being established first.

---

## Audio Capture

Start the microphone with `await bridge.audioControl(true)` and stop it with `await bridge.audioControl(false)`.

Audio data arrives through the `onEvenHubEvent` listener. Access it via `event.audioEvent.audioPcm`, which is a `Uint8Array`.

**Format:** PCM, 16 kHz sample rate, signed 16-bit little-endian, mono channel.

```typescript
// Prerequisite: createStartUpPageContainer must succeed first
await bridge.audioControl(true)

const unsubscribe = bridge.onEvenHubEvent(event => {
  if (event.audioEvent) {
    const pcm = event.audioEvent.audioPcm // Uint8Array
    // Process PCM data (Web Audio API, speech recognition, etc.)
  }
})

// Stop and clean up
await bridge.audioControl(false)
unsubscribe()
```

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

## Device Info

`await bridge.getDeviceInfo()` returns a `DeviceInfo` object or `null`.

**DeviceInfo fields:**
- `model` — device model string (G1, G2, Ring1)
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
- No camera (there is none on G2)
- Images are greyscale only

---

## Task

$ARGUMENTS
