# Test Case: handle-input

## Simulated User Request

"Add input handling to my Even Hub app: single press cycles through 3 text screens, double press exits the app, swipe up/down controls don't do anything but log a message."

## Context

- The user has a working Even Hub project with an initial page already displayed
- They want to wire up the physical button and swipe gestures on the glasses
- Single press (CLICK_EVENT): advance to the next of 3 screens (wrap around)
- Double press (DOUBLE_CLICK_EVENT): shut down and exit the app
- Swipe up (SCROLL_TOP_EVENT) and swipe down (SCROLL_BOTTOM_EVENT): log to console only
- The existing page must already have `isEventCapture: 1` set on a container for events to fire

## Output Directory

The implementer should modify:
`harness/.output/quickstart/demo-glasses/src/main.ts`

## Expected Behavior

The skill should guide the agent to:
1. Import `OsEventTypeList` from the SDK
2. Register a handler via `bridge.onEvenHubEvent()`
3. Route scroll events via `event.textEvent.eventType` and click/lifecycle events via `event.sysEvent.eventType`
4. Handle `CLICK_EVENT` — increment a screen index and call `rebuildPageContainer`
5. Handle the undefined/0 case for CLICK_EVENT value
6. Handle `DOUBLE_CLICK_EVENT` — call `shutDownPageContainer`
7. Handle `SCROLL_TOP_EVENT` and `SCROLL_BOTTOM_EVENT` — log only
8. Store or return the unsubscribe function from `onEvenHubEvent` for cleanup
