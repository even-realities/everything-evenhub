# Verification Checklist: design-guidelines

Read actual files/output. Do NOT trust the implementer's report.

## 1. Display Constraints (3 items)

- [ ] 576×288 canvas dimensions are explicitly stated
- [ ] 4-bit greyscale (16 shades of green) display characteristic is mentioned
- [ ] Absolute pixel positioning is stated as the only layout method (no CSS flexbox/grid)

## 2. Layout Patterns for 5 Options (4 items)

- [ ] List container is suggested as an option (supports up to 20 items, appropriate for 5)
- [ ] Stacked text containers are mentioned as an alternative layout approach
- [ ] Text capacity guidance is given (~400–500 chars fills the full screen, or equivalent density guidance)
- [ ] At least one concrete coordinate example or layout sketch is provided

## 3. Selection State Affordances (3 items)

- [ ] At least one visual pattern for indicating selected/active state is recommended
- [ ] `>` prefix (or similar symbol) pattern is mentioned OR `borderWidth` toggle is mentioned
- [ ] The `isEventCapture: 1` requirement for receiving selection events is stated

## 4. No-CSS Constraint (2 items)

- [ ] It is explicitly stated that CSS layout properties (flexbox, grid, relative positioning) do not apply
- [ ] The reason is given: the display renders from a WebView but uses a native container model with absolute coordinates

## 5. Community & Further Resources (2 items)

- [ ] At least one external resource is referenced (community Discord, Figma guidelines, Even Realities docs, etc.)
- [ ] The suggestion to look at example apps or the SDK reference for container specs is present

## Scoring

- **Total items:** 14
- **Pass threshold:** 14/14 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
