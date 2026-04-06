# Test Case: design-guidelines

## Simulated User Request

"I need to design a settings screen for my glasses app with 5 selectable options. What patterns should I use for the 576x288 display?"

## Context

- The user wants to build a settings screen with 5 options the user can select
- They need guidance on layout patterns suited to the G2 glasses monochrome display
- They want to know about visual affordances for selection state (highlight, prefix symbols, borders)
- No specific framework assumption — guidance should cover general patterns

## Output Directory

N/A — this is a reference/guidance skill. The implementer produces an explanation, not files.

## Expected Behavior

The skill should guide the agent to:
1. Confirm the 576×288 canvas size and that all elements must be placed with absolute pixel coordinates
2. Explain the 4-bit greyscale (16 shades of green) display constraint
3. Suggest using a list container (supports up to 20 items) or stacked text containers as layout options
4. Explain the `isEventCapture` requirement for receiving selection events
5. Recommend at least one visual pattern for indicating selection (e.g. `>` prefix, `borderWidth` toggle)
6. Give guidance on approximate text capacity (~400–500 chars fills the full screen)
7. Explicitly state that CSS layout (flexbox, grid) does not apply — only absolute positioning
8. Reference community resources or Figma design guidelines for further guidance
