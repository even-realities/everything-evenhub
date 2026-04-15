# Test Case: glasses-ui

## Simulated User Request

"Build a two-page glasses app: page 1 shows a welcome message with a list of 3 menu items (Settings, About, Exit). When user selects an item, page 2 shows the selected item name. Use text containers for page 2."

## Context

- The user already has a scaffolded Even Hub project (e.g. from quickstart)
- They want to implement multi-page navigation using the glasses UI container system
- Page 1: list container showing Welcome + 3 items
- Page 2: text container showing the name of whichever item was selected
- Navigation should use `rebuildPageContainer` for the page 2 transition

## Output Directory

The implementer should modify or create files inside the existing project, typically:
`harness/.output/quickstart/demo-glasses/src/main.ts`

## Expected Behavior

The skill should guide the agent to:
1. Create a `ListContainerProperty` with 3 items for page 1 (respecting 20-item max, 64-char-per-item limit)
2. Mark exactly one container per page with `isEventCapture: 1`
3. Use `createStartUpPageContainer` for the initial page
4. Handle selection events via `onEvenHubEvent` and read the selected index
5. Call `rebuildPageContainer` with a `TextContainerProperty` to render page 2
6. Keep all canvas coordinates within 576×288
7. Keep all `containerName` values at or under 16 characters
8. Set `containerTotalNum` equal to the actual number of containers on each page
