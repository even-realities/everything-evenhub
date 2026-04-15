---
name: harness
description: Run harness tests to verify everything-evenhub skill quality. Dispatches an implementer subagent guided by the skill, then a verifier subagent with a structured checklist. Use to validate any skill works correctly.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: <skill-name> (e.g., quickstart, glasses-ui)
---

You are running a harness test for an everything-evenhub skill. Follow these steps exactly. Do not improvise — the value of this harness is reproducibility.

## Step 1: Determine the skill to test

Extract the skill name from `$ARGUMENTS`. Valid skills: `quickstart`, `build-and-deploy`, `glasses-ui`, `handle-input`, `device-features`, `test-with-simulator`, `simulator-automation`, `font-measurement`, `sdk-reference`, `cli-reference`, `design-guidelines`, `cross-check`, `sdk-ground-truth`.

**Audit tests** (`cross-check`, `sdk-ground-truth`): these do NOT use an implementer subagent. Skip Steps 3–4 and go directly to Step 5.

## Step 2: Load all inputs

Read these 3 files (all paths relative to the everything-evenhub repo root):

1. `skills/<skill-name>/SKILL.md` → store as `SKILL_CONTENT`
2. `harness/cases/<skill-name>.md` → store as `CASE` (extract the "Simulated User Request" and "Output Directory")
3. `harness/checklists/<skill-name>.md` → store as `CHECKLIST`

If any file is missing, tell the user and stop.

## Step 3: Prepare output directory

- If the case specifies an output directory, create it: `mkdir -p <output-dir>`
- If the case requires a pre-existing project (e.g., glasses-ui needs the quickstart output), copy it:
  `cp -r harness/.output/quickstart/demo-glasses/ harness/.output/<skill-name>/demo-glasses/`
- If no pre-existing project is needed and the skill generates files (quickstart, build-and-deploy), just create the output dir.
- If the skill is a reference/guidance skill that produces code in an existing project, ensure the project exists.

## Step 4: Dispatch implementer subagent

Launch a **general-purpose** subagent with model **sonnet** using EXACTLY this prompt template (substitute the placeholders):

```
You are Claude Code executing a skill. Follow the skill instructions below to fulfill the user request.

## Skill Instructions

{SKILL_CONTENT}

## User Request

"{SIMULATED_USER_REQUEST from CASE}"

## Your Job

1. Execute the skill instructions to fulfill the user request
2. Work from: {OUTPUT_DIRECTORY from CASE}
3. After completing, if the skill produces code files, run:
   - `npx tsc --noEmit` (TypeScript check)
   - `npm run build` (Vite build)
   If either fails, fix the code and re-run until both pass.
4. Report back: what you did, files changed, build results, any issues encountered
```

Wait for the subagent to complete and capture its report as `IMPLEMENTER_REPORT`.

## Step 5: Dispatch verifier subagent

Launch a **superpowers:code-reviewer** subagent using EXACTLY this prompt template:

```
You are verifying the output of an everything-evenhub harness test.

## What Was Requested

{SIMULATED_USER_REQUEST from CASE}

## What Implementer Claims

{IMPLEMENTER_REPORT}

## CRITICAL: Do Not Trust the Report

Read the ACTUAL files on disk. Verify independently.

## Verification Checklist

{CHECKLIST content}

## Output Location

{OUTPUT_DIRECTORY from CASE}

## Instructions

1. Read every file referenced in the checklist
2. For code-producing skills, run `npx tsc --noEmit` and `npm run build` yourself
3. Report PASS or FAIL for each checklist item
4. For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
5. At the end provide: Score (X/Y), critical issues, skill improvement suggestions
```

Wait for the verifier to complete and capture its report as `VERIFIER_REPORT`.

## Step 6: Report results

Present to the user in this format:

```
## Harness Result: <skill-name>

**Score:** X/Y PASS

### FAIL items (if any)
| # | Item | Issue | Cause (agent/skill) |

### Skill improvement suggestions (if any)
| # | Suggestion | Reason |

### Verdict: PASS / NEEDS_FIX
```

If there are skill improvements needed, ask: "Apply these fixes to the skill?"

## Task

Run harness test for: $ARGUMENTS
