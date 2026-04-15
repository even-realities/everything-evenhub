# Verification Checklist: device-features

Read actual files/output. Do NOT trust the implementer's report.

## 1. Audio Control API Usage (4 items)

- [ ] `bridge.audioControl(true)` is called to start recording
- [ ] `bridge.audioControl(false)` is called to stop recording
- [ ] `createStartUpPageContainer` is called before any `audioControl` invocation
- [ ] The audio format is noted in code comments or explained: PCM 16 kHz, signed 16-bit LE, mono

## 2. Audio Data Reception (2 items)

- [ ] `bridge.onEvenHubEvent` handler checks `event.audioEvent.audioPcm` for incoming audio data
- [ ] The handler distinguishes audio events from other event types (no accidental mixing with button events)

## 3. Toggle State Logic (3 items)

- [ ] A boolean variable (or equivalent) tracks whether recording is currently active
- [ ] First CLICK_EVENT starts recording (`audioControl(true)`) and sets state to recording
- [ ] Second CLICK_EVENT stops recording (`audioControl(false)`) and sets state to stopped

## 4. Display Updates (3 items)

- [ ] Display shows `"Recording..."` (or equivalent) when recording starts
- [ ] Display shows `"Stopped"` (or equivalent) when recording stops
- [ ] Display update uses `textContainerUpgrade` or `rebuildPageContainer` (not just a console.log)

## 5. Cleanup (2 items)

- [ ] `bridge.audioControl(false)` is called on shutdown/cleanup
- [ ] The `onEvenHubEvent` unsubscribe function is called on cleanup

## 6. Code Quality (3 items)

- [ ] All SDK APIs used (`audioControl`, `onEvenHubEvent`, container calls) are correctly imported
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds without errors

## Scoring

- **Total items:** 17
- **Pass threshold:** 17/17 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
