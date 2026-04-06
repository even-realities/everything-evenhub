# Test Case: device-features

## Simulated User Request

"Add microphone audio capture to my glasses app. When user presses, start recording. When user presses again, stop recording. Show 'Recording...' and 'Stopped' on the display."

## Context

- The user has a working Even Hub project with an initial page displayed
- They want to capture PCM audio from the glasses microphone
- The display should reflect the current state: "Recording..." when active, "Stopped" when idle
- Toggle behavior: first CLICK_EVENT starts recording, second CLICK_EVENT stops it
- `createStartUpPageContainer` must be called before `bridge.audioControl()` can work

## Output Directory

The implementer should modify:
`harness/.output/quickstart/demo-glasses/src/main.ts`

## Expected Behavior

The skill should guide the agent to:
1. Call `bridge.audioControl(true)` to start recording and `bridge.audioControl(false)` to stop
2. Listen for `event.audioEvent.audioPcm` inside `onEvenHubEvent` to receive audio data
3. Note the audio format: PCM 16 kHz, signed 16-bit little-endian, mono
4. Call `createStartUpPageContainer` before invoking `audioControl` (required prerequisite)
5. Use a boolean toggle variable to track recording state
6. Update the display text with `textContainerUpgrade` or `rebuildPageContainer` on each state change
7. Clean up on exit: call `unsubscribe()` and `bridge.audioControl(false)`
8. Include correct SDK imports for all used APIs
