# Test Case: cross-check

## Simulated User Request

N/A — this is an automated consistency audit, not a user-facing skill test.

## Context

Multiple skills document the same SDK types, constants, and constraints (e.g., `borderColor` range, `content` character limit, display dimensions, container limits). When one skill is updated but others are not, contradictions arise that confuse AI agents and developers alike.

This test does NOT dispatch an implementer subagent. It directly scans all skill files and flags inconsistencies.

## What To Check

The verifier must grep all `skills/*/SKILL.md` files and compare every claim about:

1. **Value ranges** — numeric min/max for properties like `borderColor`, `borderWidth`, `borderRadius`, `paddingLength`, `width`, `height`, `xPosition`, `yPosition`
2. **Character/byte limits** — `content` max length, `containerName` max length, `itemName` max length
3. **Container limits** — max text containers, max image containers, max total containers
4. **Display constants** — resolution, colour depth, line height, list item height
5. **SDK version** — `min_sdk_version`, "Current version" strings
6. **Image container dimension ranges** — width/height min and max

## Output Directory

N/A — produces a report only.

## Expected Behavior

The verifier scans all skill files and reports:
- PASS if all skills agree on each shared claim
- FAIL with the exact conflicting values and file locations for each disagreement
