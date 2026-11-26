---
name: background-state
description: Implement background state persistence for Even Hub G2 plugins — analyzes existing plugin code, identifies state that must survive the phone going to the background (Android may suspend the WebView and start the plugin cold), persists it with the SDK's local storage, restores it on startup, and re-arms mic/location streams on foreground. Use when a plugin loses state after the phone goes to the background and returns.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [source file or directory to analyze]
---

# Background State

Make an Even Hub plugin survive background/foreground transitions using only APIs that ship in `@evenrealities/even_hub_sdk` today: `bridge.setLocalStorage` / `bridge.getLocalStorage` and the `FOREGROUND_EXIT_EVENT` / `FOREGROUND_ENTER_EVENT` system events.

> **Note on `setBackgroundState` / `onBackgroundRestore`:** earlier versions of this skill told agents to import these two functions. They are **not exported by any published SDK version** (checked 0.0.3 through 0.0.16), so code using them fails to compile (`TS2305: Module '"@evenrealities/even_hub_sdk"' has no exported member 'setBackgroundState'`). See [#16](https://github.com/even-realities/everything-evenhub/issues/16). Do not generate them unless the SDK version in the project actually exports them.

## Background

From the [Background & Lifecycle](https://hub.evenrealities.com/docs/build/background-lifecycle) docs:

| Platform | When the Even app backgrounds |
|----------|-------------------------------|
| iOS (WKWebView) | The WebView keeps running; in-memory JS state survives |
| Android (Chromium WebView) | May be **suspended** under memory pressure; the plugin then starts cold and in-memory state is gone |

| Resource | On background / lock |
|----------|----------------------|
| Local storage | Always survives (persisted to disk) |
| In-memory JS state | iOS: survives. Android: may be lost |
| Open WebSocket | Android: typically dropped if suspended — reconnect on relaunch |
| `audioControl(true, …)` capture | Stops if the WebView is suspended — re-enable on foreground with the same `AudioInputSource` |
| `startAppLocationUpdates(…)` | Stops if the WebView is suspended — re-arm on foreground |

So the rule is: **persist anything important eagerly, restore it at startup, and re-arm streams when the plugin comes back to the foreground.** The Beta Testing lock-screen check (lock the phone for 5 minutes, relaunch) exists to catch exactly these bugs.

## When to Use

Apply this skill when a plugin:
- Shows counters, scores, timers, or sequence numbers that advance over time
- Tracks a selected item, current page, or active mode
- Maintains a data buffer or history that should not reset
- Uses `audioControl`, `startAppLocationUpdates`, or a WebSocket that must be live after the user returns

## API Reference (SDK 0.0.16)

```typescript
import { waitForEvenAppBridge, OsEventTypeList, AudioInputSource } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

await bridge.setLocalStorage('appState', JSON.stringify(snapshot)) // Promise<boolean>
const raw = await bridge.getLocalStorage('appState')               // Promise<string> ('' if unset)

bridge.onEvenHubEvent(event => {
  const type = event.sysEvent?.eventType
  if (type === OsEventTypeList.FOREGROUND_EXIT_EVENT) { /* persist now */ }
  if (type === OsEventTypeList.FOREGROUND_ENTER_EVENT) { /* re-arm streams */ }
})
```

**Rules:**
- Store a **plain JSON-serializable snapshot** (no class instances, functions, Maps, Sets, Dates)
- Persist **eagerly** (on every meaningful change, debounced) — on Android the plugin may be killed without a usable exit event
- Also persist on `FOREGROUND_EXIT_EVENT` and on `document.visibilitychange` → `hidden` as backups
- Restore **once at startup**, after `waitForEvenAppBridge()` and before rendering the first page, with `??` fallbacks for every field and a `try/catch` around `JSON.parse`
- Re-arm `audioControl` / `startAppLocationUpdates` / sockets on `FOREGROUND_ENTER_EVENT` if they were active before

## Workflow

### Step 1 — Read the source

If `$ARGUMENTS` points to a file, read it directly. If it points to a directory, glob for `*.ts` and `*.tsx` files and read the most relevant ones (typically `main.ts`, `index.ts`, or the file containing `waitForEvenAppBridge`).

Check `package.json` for the installed SDK version and use only APIs it exports.

### Step 2 — Identify snapshot-worthy state

| Pattern | Example | Snapshot? |
|---------|---------|-----------|
| Primitive counter or timer | `let counter = 0` / `frameIndex++` | ✅ Yes |
| Selected index or active mode | `let selectedIdx = 0` / `let mode: 'A'\|'B' = 'A'` | ✅ Yes |
| Data buffer or history array | `const history: string[] = []` | ✅ Yes |
| Config set at startup | `let speed = 1` then later `speed = userChoice` | ✅ Yes |
| Whether a stream was active | `let micOn = false` | ✅ Yes — needed to re-arm on foreground |
| Derived / computed value | `const label = items[selectedIdx].name` | ❌ No — re-derive after restore |
| WebView lifecycle flag | `let isReady = false` | ❌ No — will re-initialize |
| Bridge / controller reference | `let bridge: EvenAppBridge` | ❌ No — not serializable |
| Ephemeral UI flag | `let isAnimating = false` | ❌ No — transient |

**Key heuristic**: a variable is snapshot-worthy if losing it on a cold start would make the plugin behave differently than if the phone had never gone to the background.

### Step 3 — Choose storage keys

Use one key per logical state group (typically 1–2 per plugin), e.g. `'appState'`, `'selection'`.

### Step 4 — Generate and insert the code

1. **Restore** right after `waitForEvenAppBridge()` and before the first page is built.
2. **Persist** through a small debounced `persist()` helper; call it wherever snapshot-worthy state changes.
3. In the existing `bridge.onEvenHubEvent` handler, persist on `FOREGROUND_EXIT_EVENT` and re-arm streams on `FOREGROUND_ENTER_EVENT`. Do not create a second listener if one already exists.
4. Add a `visibilitychange` backup.

### Step 5 — Verify correctness

- [ ] Only APIs exported by the installed SDK are imported (no `setBackgroundState` / `onBackgroundRestore` on 0.0.16)
- [ ] Restore runs once at startup with `try/catch` and `??` fallbacks
- [ ] The persisted value is a snapshot copy built from plain values
- [ ] Persist is called on every meaningful state change (debounced), on `FOREGROUND_EXIT_EVENT`, and on `visibilitychange` → `hidden`
- [ ] Streams that were active are re-armed on `FOREGROUND_ENTER_EVENT` with the same `AudioInputSource`
- [ ] `npx tsc --noEmit` passes

## Complete Example

**Before** (loses state when Android suspends the WebView; mic stays dead after return):

```typescript
import { waitForEvenAppBridge, OsEventTypeList, AudioInputSource } from '@evenrealities/even_hub_sdk'

let counter = 0
let lastEvent = ''
let micOn = false

const bridge = await waitForEvenAppBridge()
await bridge.createStartUpPageContainer(container)

setInterval(() => {
  counter++
  bridge.rebuildPageContainer(buildPage(counter))
}, 500)

bridge.onEvenHubEvent(event => {
  if (event.sysEvent) {
    lastEvent = `sys:${event.sysEvent.eventType ?? 0}`
  }
})
```

**After** (type-checks against SDK 0.0.16):

```typescript
import { waitForEvenAppBridge, OsEventTypeList, AudioInputSource } from '@evenrealities/even_hub_sdk'

let counter = 0
let lastEvent = ''
let micOn = false

const STATE_KEY = 'appState'
const bridge = await waitForEvenAppBridge()

// Restore once at startup (Android may have started us cold)
const raw = await bridge.getLocalStorage(STATE_KEY)
if (raw) {
  try {
    const s = JSON.parse(raw) as Partial<{ counter: number; lastEvent: string; micOn: boolean }>
    counter = s.counter ?? counter
    lastEvent = s.lastEvent ?? lastEvent
    micOn = s.micOn ?? micOn
  } catch { /* ignore corrupt state */ }
}

// Persist a plain snapshot, debounced
const snapshot = () => JSON.stringify({ counter, lastEvent, micOn })
let saveTimer: ReturnType<typeof setTimeout> | undefined
function persist(): void {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { void bridge.setLocalStorage(STATE_KEY, snapshot()) }, 250)
}

await bridge.createStartUpPageContainer(container)
if (micOn) await bridge.audioControl(true, AudioInputSource.Glasses)

setInterval(() => {
  counter++
  persist()
  bridge.rebuildPageContainer(buildPage(counter))
}, 500)

bridge.onEvenHubEvent(async event => {
  const type = event.sysEvent?.eventType
  if (type === OsEventTypeList.FOREGROUND_EXIT_EVENT) {
    await bridge.setLocalStorage(STATE_KEY, snapshot())
  }
  if (type === OsEventTypeList.FOREGROUND_ENTER_EVENT && micOn) {
    // Capture stops if the WebView was suspended — re-arm it
    await bridge.audioControl(true, AudioInputSource.Glasses)
  }
  if (event.sysEvent) {
    lastEvent = `sys:${type ?? 0}`
    persist()
  }
})

// Backup for hosts that suspend without a foreground event
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void bridge.setLocalStorage(STATE_KEY, snapshot())
})
```

## Common Mistakes

### Importing APIs the SDK doesn't export

```typescript
// ❌ Wrong on SDK 0.0.16 — TS2305: no exported member 'setBackgroundState'
import { setBackgroundState, onBackgroundRestore } from '@evenrealities/even_hub_sdk'

// ✅ Correct — use the storage API and lifecycle events that ship today
import { waitForEvenAppBridge, OsEventTypeList } from '@evenrealities/even_hub_sdk'
```

### Persisting only on exit

```typescript
// ❌ Risky — on Android the process can be reclaimed without a usable exit event
bridge.onEvenHubEvent(e => {
  if (e.sysEvent?.eventType === OsEventTypeList.FOREGROUND_EXIT_EVENT) void bridge.setLocalStorage(KEY, snapshot())
})

// ✅ Correct — persist on every change (debounced) and use exit as a backup
counter++
persist()
```

### Storing a live reference or non-JSON values

```typescript
// ❌ Wrong — Map and Date do not survive a JSON round-trip
void bridge.setLocalStorage(KEY, JSON.stringify({ items: new Map([['a', 1]]), at: new Date() }))

// ✅ Correct — convert to plain types
void bridge.setLocalStorage(KEY, JSON.stringify({ items: Object.fromEntries(itemsMap), at: Date.now() }))
```

### Restoring without guards

```typescript
// ❌ Wrong — throws on corrupt data, or resets fields that are missing
const s = JSON.parse(await bridge.getLocalStorage(KEY))
counter = s.counter

// ✅ Correct — guard the parse and keep current values as fallbacks
try { const s = JSON.parse(raw); counter = s.counter ?? counter } catch { /* keep defaults */ }
```

### Forgetting to re-arm streams

```typescript
// ❌ Wrong — after Android suspends the WebView, audio/location streams are dead
// ✅ Correct — on FOREGROUND_ENTER_EVENT, call audioControl(true, sameSource) / startAppLocationUpdates(...) again if they were active
```

## Task

Analyze the plugin code at `$ARGUMENTS`. Identify all snapshot-worthy state variables following the table above. Then insert the restore / persist / foreground handling at the correct locations using only APIs exported by the installed SDK. Report a summary of:
1. State variables identified and why they are snapshot-worthy
2. What was skipped and why
3. The key(s) chosen, the streams re-armed, and the exact code inserted
