# Verification Checklist: handle-input

Read actual files/output. Do NOT trust the implementer's report.

## 1. Imports & Setup (3 items)

- [ ] `OsEventTypeList` is imported from `@evenrealities/even_hub_sdk`
- [ ] `bridge.onEvenHubEvent()` is called to register the event handler
- [ ] The container used to receive events has `isEventCapture: 1`

## 2. CLICK_EVENT Handling (4 items)

- [ ] The handler checks for `OsEventTypeList.CLICK_EVENT` (or equivalent numeric value)
- [ ] The undefined/value-0 case for CLICK_EVENT is explicitly handled (not silently ignored)
- [ ] A screen index variable is incremented (with wrap-around for 3 screens)
- [ ] `rebuildPageContainer` is called with the correct new screen content

## 3. DOUBLE_CLICK_EVENT Handling (2 items)

- [ ] The handler checks for `OsEventTypeList.DOUBLE_CLICK_EVENT`
- [ ] `shutDownPageContainer` is called when double press is detected

## 4. Scroll Event Handling (2 items)

- [ ] `OsEventTypeList.SCROLL_TOP_EVENT` is handled with a `console.log` call
- [ ] `OsEventTypeList.SCROLL_BOTTOM_EVENT` is handled with a `console.log` call

## 5. Cleanup (2 items)

- [ ] The return value of `bridge.onEvenHubEvent()` (unsubscribe function) is stored or returned
- [ ] No dangling event listener is left if the page is torn down (unsubscribe is called or documented as needed)

## 6. Code Quality (3 items)

- [ ] Event routing is via `event.textEvent` on a container with `isEventCapture: 1`
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds without errors

## Scoring

- **Total items:** 16
- **Pass threshold:** 16/16 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
