# Test Case: sdk-reference

## Simulated User Request

"What are the TypeScript types for createStartUpPageContainer? Show me the full interface for the container parameter and all possible result codes."

## Context

- The user is writing TypeScript code for an Even Hub app
- They want the complete type signatures and result codes for `createStartUpPageContainer`
- They may also need the nested container property types referenced by the main interface

## Output Directory

N/A — this is a reference skill. The implementer produces an explanation with type definitions, not files.

## Expected Behavior

The skill should guide the agent to:
1. Show the `CreateStartUpPageContainer` interface with all fields
2. Show the `TextContainerProperty` interface with all fields and valid value ranges
3. Show the `ListContainerProperty` interface with its fields
4. Show the `ImageContainerProperty` interface with correct dimension ranges
5. List all values in the `StartUpPageCreateResult` enum with their numeric codes
6. Note the `containerTotalNum` valid range (1–12)
7. Note the limits: max 8 `textObject` entries, max 4 `imageObject` entries
8. Explain the `isEventCapture` rule (exactly one container per page must be set to 1)
