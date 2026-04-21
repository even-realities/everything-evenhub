---
name: background-state
description: Implement background state persistence for Even Hub G2 plugins — automatically analyzes existing plugin code, identifies state that needs to survive background/foreground transitions, and inserts setBackgroundState + onBackgroundRestore calls. Use when a plugin loses state after the phone goes to the background and returns.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [source file or directory to analyze]
---

# Background State

Add background state persistence to an Even Hub plugin by analyzing its code and inserting `setBackgroundState` + `onBackgroundRestore` calls from `@evenrealities/even_hub_sdk`.

## Background

The Even Hub host app uses a **Headless WebView migration** strategy when the phone goes to the background:

1. **`inactive`** — host snapshots current JS state via `window.__getStateSnapshot()`
2. **`paused`** — host creates a new `HeadlessInAppWebView`, loads the same plugin URL, and calls `window.__restoreState(snapshot)` to replay the saved state
3. **Background** — the headless WebView runs invisibly, continuing to push frames to the glasses
4. **`resumed`** — snapshot is injected into the foreground WebView before it wakes up, then the headless WebView is destroyed

If a plugin does **not** register any state exporters, `__getStateSnapshot()` returns `'{}'` and the headless WebView starts from scratch — causing the plugin to reset to its initial state every time the phone comes back from the background.

## When to Use

Apply this skill when a plugin:
- Shows counters, scores, timers, or sequence numbers that advance over time
- Tracks a selected item, current page, or active mode
- Maintains a data buffer or history that should not reset
- Has any variable that changes *during* plugin execution and must be consistent on foreground return

## API Reference

```typescript
import { setBackgroundState, onBackgroundRestore } from '@evenrealities/even_hub_sdk'

// Register state exporter — called by host before going to background
setBackgroundState('myKey', () => ({ ...myState }))

// Register state restorer — called by host after headless WebView loads
onBackgroundRestore('myKey', (saved) => {
  const s = saved as typeof myState
  myState = { ...myState, ...s }
})
```

**Rules:**
- `key` must be the same string in both calls
- The exporter must return a **plain JSON-serializable object** (no class instances, no functions, no Maps, no Sets)
- The restorer receives `Record<string, unknown>` — always cast before use
- Both calls must run **at module init time** (top level or inside the startup function, before `bridge.onEvenHubEvent`)
- Call `setBackgroundState` **before** any code that modifies the state variables, so the initial snapshot is always valid

## Workflow

### Step 1 — Read the source

If `$ARGUMENTS` points to a file, read it directly. If it points to a directory, glob for `*.ts` and `*.tsx` files and read the most relevant ones (typically `main.ts`, `index.ts`, or the file containing `waitForEvenAppBridge`).

### Step 2 — Identify snapshot-worthy state

Look for variables that:

| Pattern | Example | Snapshot? |
|---------|---------|-----------|
| Primitive counter or timer | `let counter = 0` / `frameIndex++` | ✅ Yes |
| Selected index or active mode | `let selectedIdx = 0` / `let mode: 'A'\|'B' = 'A'` | ✅ Yes |
| Data buffer or history array | `const history: string[] = []` | ✅ Yes |
| Config set at startup | `let speed = 1` then later `speed = userChoice` | ✅ Yes |
| Derived / computed value | `const label = items[selectedIdx].name` | ❌ No — re-derive after restore |
| WebView lifecycle flag | `let isReady = false` | ❌ No — will re-initialize |
| Bridge / controller reference | `let bridge: EvenAppBridge` | ❌ No — not serializable |
| Ephemeral UI flag | `let isAnimating = false` | ❌ No — transient |

**Key heuristic**: a variable is snapshot-worthy if losing it on background entry would cause the plugin to behave differently than if it had never gone to the background.

### Step 3 — Choose snapshot keys

Use one key per logical state group. Avoid one key per variable (too granular) and one key for everything (too coarse). A single plugin typically needs 1–2 keys.

Examples:
- `'counter'` for a frame counter
- `'appState'` for the main mutable state object
- `'selection'` for the currently selected item index + related data

### Step 4 — Generate and insert the code

Find the correct insertion point — **after** state variable declarations, **before** `bridge.onEvenHubEvent(...)`. Insert:

```typescript
// Background state persistence — survives host background/foreground migration
setBackgroundState('myKey', () => ({ /* snapshot of mutable state */ }))
onBackgroundRestore('myKey', (saved) => {
  const s = saved as { /* type annotation */ }
  // restore each field with nullish fallback
})
```

Also add the import if not already present:
```typescript
import { setBackgroundState, onBackgroundRestore } from '@evenrealities/even_hub_sdk'
```

### Step 5 — Verify correctness

After inserting, confirm:
- [ ] Import line present, no duplicate imports
- [ ] Both calls use the **same key string**
- [ ] Exporter spreads a **snapshot copy** (`{ ...state }`, not a live reference)
- [ ] Restorer **reassigns** the live variable (not just reads from `saved`)
- [ ] No class instances, Dates, Maps, or Sets in the exported object
- [ ] Every field in the restorer uses `??` fallback to its current value

## Complete Example

**Before** (loses all state on background transition):

```typescript
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'

let counter = 0
let lastEvent = ''

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

**After** (state survives background):

```typescript
import { waitForEvenAppBridge, setBackgroundState, onBackgroundRestore } from '@evenrealities/even_hub_sdk'

let counter = 0
let lastEvent = ''

// Background state persistence — survives host background/foreground migration
setBackgroundState('appState', () => ({ counter, lastEvent }))
onBackgroundRestore('appState', (saved) => {
  const s = saved as { counter: number; lastEvent: string }
  counter = s.counter ?? counter
  lastEvent = s.lastEvent ?? lastEvent
})

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

## Common Mistakes

### Capturing a reference instead of a snapshot

```typescript
// ❌ Wrong — exporter returns the live object reference; value changes by the time host reads it
setBackgroundState('state', () => myState)

// ✅ Correct — spread creates a snapshot copy at the moment of export
setBackgroundState('state', () => ({ ...myState }))
```

### Restorer reads but does not reassign

```typescript
// ❌ Wrong — local const, live variable unchanged
onBackgroundRestore('state', (saved) => {
  const s = saved as typeof myState
  console.log(s.counter) // myState.counter still 0
})

// ✅ Correct — reassign the live variable
onBackgroundRestore('state', (saved) => {
  const s = saved as typeof myState
  myState = { ...myState, ...s }
})
```

### Non-serializable values in snapshot

```typescript
// ❌ Wrong — Map and Date do not survive JSON round-trip
setBackgroundState('state', () => ({
  items: new Map([['a', 1]]),
  timestamp: new Date(),
}))

// ✅ Correct — convert to plain types
setBackgroundState('state', () => ({
  items: Object.fromEntries(itemsMap),
  timestamp: Date.now(),
}))
```

### Missing nullish guard in restorer

```typescript
// ❌ Wrong — crashes or resets to 0 if field missing in snapshot
onBackgroundRestore('state', (saved) => {
  const s = saved as { counter: number }
  counter = s.counter
})

// ✅ Correct — keep current value as fallback when field absent
onBackgroundRestore('state', (saved) => {
  const s = saved as { counter: number }
  counter = s.counter ?? counter
})
```

### Registering inside a conditional or event handler

```typescript
// ❌ Wrong — if this code path isn't hit before background, state is not saved
bridge.onEvenHubEvent(event => {
  if (event.sysEvent?.eventType === 4) {
    setBackgroundState('state', () => ({ counter })) // too late
  }
})

// ✅ Correct — always register at module init time
setBackgroundState('state', () => ({ counter }))
bridge.onEvenHubEvent(event => { /* ... */ })
```

## Task

Analyze the plugin code at `$ARGUMENTS`. Identify all snapshot-worthy state variables following the table above. Then insert `setBackgroundState` + `onBackgroundRestore` at the correct location. Report a summary of:
1. State variables identified and why they are snapshot-worthy
2. What was skipped and why
3. The key(s) chosen and the exact code inserted
