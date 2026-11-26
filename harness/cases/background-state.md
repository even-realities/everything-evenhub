# Test Case: background-state

## Simulated User Request

"My glasses app forgets everything when I lock my phone and come back. It counts taps and lets me toggle the microphone on and off. Make the tap count survive backgrounding, and make sure the microphone comes back on if it was on."

## Context

- The user has a working Even Hub project (from the quickstart output) with a startup page and an `onEvenHubEvent` handler
- The plugin keeps `let taps = 0` and `let micOn = false` in memory, increments `taps` on CLICK_EVENT, and toggles `bridge.audioControl(micOn)` on DOUBLE_CLICK_EVENT
- The installed SDK is `@evenrealities/even_hub_sdk` 0.0.16
- On Android the WebView may be suspended in the background and the plugin may start cold; mic capture stops if the WebView is suspended

## Output Directory

The implementer should modify:
`harness/.output/quickstart/demo-glasses/src/main.ts`

## Expected Behavior

The skill should guide the agent to:
1. Use only APIs exported by SDK 0.0.16 (`bridge.setLocalStorage`, `bridge.getLocalStorage`, `OsEventTypeList.FOREGROUND_EXIT_EVENT` / `FOREGROUND_ENTER_EVENT`) — not `setBackgroundState` / `onBackgroundRestore`
2. Restore `taps` and `micOn` once at startup with a guarded `JSON.parse` and `??` fallbacks
3. Persist a plain JSON snapshot on every change (debounced), on `FOREGROUND_EXIT_EVENT`, and on `visibilitychange` → `hidden`
4. Re-enable `audioControl(true, …)` on `FOREGROUND_ENTER_EVENT` (and after restore) when `micOn` was true
5. Reuse the existing `onEvenHubEvent` listener instead of adding a second one
6. Keep the project compiling with `npx tsc --noEmit`
