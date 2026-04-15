# Test Case: font-measurement

## Simulated User Request

"I need to display a long notification message and a 5-item menu list on my G2 glasses. The text container is 300px wide with 8px padding and 1px border. The list container is 250px wide with no padding. Help me calculate the exact container sizes so nothing overflows or triggers a scrollbar."

## Context

- The user has a working Even Hub project and wants pixel-accurate container sizing
- They need to use `@evenrealities/pretext` to measure text and list dimensions
- The text container has padding and border that reduce the inner text area
- The list container has no padding, so items render at full width
- Both containers must fit within the 576 x 288 display

## Output Directory

The implementer should modify:
`harness/.output/font-measurement/demo-glasses/src/main.ts`

## Expected Behavior

The skill should guide the agent to:
1. Install `@evenrealities/pretext` if not already installed
2. Import `measureTextWrap` and `measureList` from `@evenrealities/pretext`
3. For the text container: subtract `2 * (padding + border)` from the container width before measuring
4. Use `measureTextWrap(text, innerWidth)` to get line count and height
5. Set the text container height to `lineCount * 27 + 2 * (padding + border)` or use `measureTextWrap` with `containerPadding` parameter
6. For the list container: use `measureList(items, 0)` and use `requiredHeight` for the container height
7. Verify each item is 40px tall (fixed) and total list height is `items.length * 40`
8. Ensure both containers fit within 576 x 288 display bounds
