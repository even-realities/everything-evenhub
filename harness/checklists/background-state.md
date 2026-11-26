# Verification Checklist: background-state

Read actual files/output. Do NOT trust the implementer's report.

## 1. SDK API Validity (3 items)

- [ ] No import of `setBackgroundState` or `onBackgroundRestore` (not exported by SDK 0.0.16)
- [ ] State is persisted with `bridge.setLocalStorage` and read with `bridge.getLocalStorage`
- [ ] Lifecycle handling uses `OsEventTypeList.FOREGROUND_EXIT_EVENT` and `OsEventTypeList.FOREGROUND_ENTER_EVENT` from `event.sysEvent.eventType`

## 2. Restore (3 items)

- [ ] Restore runs once at startup, after `waitForEvenAppBridge()` and before the first page is rendered
- [ ] `JSON.parse` is wrapped in `try/catch`
- [ ] Every restored field uses a `??` fallback to its current value

## 3. Persist (4 items)

- [ ] The stored value is a plain JSON snapshot (no Map/Set/Date/class instances/live references)
- [ ] Persist is called whenever `taps` or `micOn` changes (debounced or immediate)
- [ ] Persist also runs on `FOREGROUND_EXIT_EVENT`
- [ ] Persist also runs on `document.visibilitychange` when hidden

## 4. Stream Re-arm (2 items)

- [ ] On `FOREGROUND_ENTER_EVENT`, `bridge.audioControl(true, …)` is called again if `micOn` was true
- [ ] After a cold-start restore with `micOn === true`, capture is re-enabled after `createStartUpPageContainer`

## 5. Code Quality (3 items)

- [ ] Only one `onEvenHubEvent` listener exists (the existing one was extended)
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds without errors

## Scoring

- **Total items:** 15
- **Pass threshold:** 15/15 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
