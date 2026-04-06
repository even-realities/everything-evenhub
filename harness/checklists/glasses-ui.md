# Verification Checklist: glasses-ui

Read actual files/output. Do NOT trust the implementer's report.

## 1. Page 1 — List Container (5 items)

- [ ] A `ListContainerProperty` is created with exactly 3 items (`Settings`, `About`, `Exit` or equivalent)
- [ ] Each item string is 64 characters or fewer
- [ ] The `ListContainerProperty` has `isEventCapture: 1`
- [ ] No other container on page 1 has `isEventCapture: 1` (exactly one per page)
- [ ] `containerTotalNum` on the startup call matches the actual number of containers passed

## 2. Page 2 — Text Container (4 items)

- [ ] A `TextContainerProperty` is created for page 2
- [ ] Page 2 `TextContainerProperty` displays the name of the item selected on page 1 (dynamic content)
- [ ] Exactly one container on page 2 has `isEventCapture: 1`
- [ ] `containerTotalNum` on the rebuild call matches the actual number of containers on page 2

## 3. Navigation & Lifecycle (4 items)

- [ ] `createStartUpPageContainer` is used for the initial page 1
- [ ] `rebuildPageContainer` is used to transition to page 2
- [ ] `bridge.onEvenHubEvent` is used to register the selection handler
- [ ] The selected list index (or item name) is correctly extracted from the event and passed to page 2

## 4. Canvas & Naming Constraints (4 items)

- [ ] All container `x` coordinates are within 0–576
- [ ] All container `y` coordinates are within 0–288
- [ ] All `containerName` values are 16 characters or fewer
- [ ] `widgetId` is unique per container (no duplicate IDs on the same page)

## 5. Code Quality (3 items)

- [ ] Correct SDK types are imported from `@evenrealities/even_hub_sdk`
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds without errors

## Scoring

- **Total items:** 20
- **Pass threshold:** 20/20 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
