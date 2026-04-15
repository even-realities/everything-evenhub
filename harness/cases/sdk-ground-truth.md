# Test Case: sdk-ground-truth

## Simulated User Request

N/A — this is an automated validation against the SDK source, not a user-facing skill test.

## Context

Skills document SDK types and constraints based on manual inspection. Over time, the SDK evolves (new fields, changed ranges, renamed types) while skill files lag behind. This test validates skill claims against the actual SDK package.

This test does NOT dispatch an implementer subagent.

## Prerequisites

The SDK package must be installed locally:

```bash
npm install @evenrealities/even_hub_sdk
```

## What To Check

The verifier must:

1. Read the SDK's TypeScript type definitions from `node_modules/@evenrealities/even_hub_sdk`
2. Extract all exported interfaces, types, enums, and their fields
3. Compare against claims in `skills/sdk-reference/SKILL.md` and other skills that reference SDK types

Specific checks:

- **Exported interfaces** — every interface in sdk-reference should exist in the SDK `.d.ts` files
- **Field names** — every field listed in skill docs should exist in the corresponding SDK interface
- **Enum values** — every enum value listed should exist with the correct numeric/string value
- **Method signatures** — method parameter types and return types should match
- **Missing APIs** — any SDK export NOT documented in skills (potential coverage gap)

## Output Directory

N/A — produces a report only.

## Expected Behavior

The verifier produces a table:

| Claim (skill file:line) | SDK source | Match? |
|---|---|---|
| `TextContainerProperty.borderColor: number` | `borderColor: number` | PASS |
| ... | ... | ... |

Any FAIL indicates a skill that has drifted from the SDK and needs updating.
