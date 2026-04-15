# Verification Checklist: font-measurement

Read actual files/output. Do NOT trust the implementer's report.

## 1. Installation and Imports (2 items)

- [ ] `@evenrealities/pretext` is installed or listed as a dependency
- [ ] At least one measurement function is imported from `@evenrealities/pretext` (`measureTextWrap`, `measureList`, `pxTruncate`, or `getTextWidth`)

## 2. Text Measurement (4 items)

- [ ] `measureTextWrap` is used to measure the notification text
- [ ] Inner width is calculated by subtracting padding and border: `width - 2 * (padding + border)` (i.e., `300 - 2 * (8 + 1) = 282`)
- [ ] Text is measured against the **inner** width, not the full container width
- [ ] Container height is derived from the measurement result (using `lineCount * 27` plus padding/border insets, or the `height` field from `measureTextWrap` with `containerPadding`)

## 3. List Measurement (3 items)

- [ ] `measureList` is used to measure the 5-item menu list
- [ ] Each list item height is 40px (fixed constant used or acknowledged)
- [ ] Container height is derived from `requiredHeight` or calculated as `items.length * 40` (plus any padding)

## 4. Padding and Border Accounting (3 items)

- [ ] The code does NOT measure text against the full 300px container width (common mistake)
- [ ] Both `paddingLength` and `borderWidth` are accounted for when computing inner dimensions
- [ ] The total inset per side is correctly computed as `paddingLength + borderWidth`

## 5. Display Bounds (2 items)

- [ ] Container dimensions stay within 576 x 288 display bounds
- [ ] Both containers (text + list) can coexist on the display without overlapping off-screen

## 6. Code Quality (3 items)

- [ ] All measurement APIs used are correctly imported from `@evenrealities/pretext`
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors
- [ ] `npm run build` succeeds without errors

## Scoring

- **Total items:** 17
- **Pass threshold:** 17/17 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
