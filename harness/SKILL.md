---
name: harness
description: Run harness tests to verify evenhub-skills quality. Dispatches an implementer subagent guided by the skill, then a verifier subagent with a structured checklist. Use to validate any skill works correctly.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: <skill-name> (e.g., quickstart, glasses-ui)
---

You are running a harness test for an evenhub-skill. Follow these steps exactly.

## Steps

### 1. Determine the skill to test

Extract the skill name from `$ARGUMENTS`. Valid skills: `quickstart`, `build-and-deploy`, `glasses-ui`, `handle-input`, `device-features`, `test-with-simulator`, `sdk-reference`, `cli-reference`, `design-guidelines`.

### 2. Load test case and checklist

Read the following files:
- `harness/cases/<skill-name>.md` — the simulated user request and context
- `harness/checklists/<skill-name>.md` — the verification checklist
- `skills/<skill-name>/SKILL.md` — the skill being tested

If a test case or checklist does not exist for this skill, inform the user and stop.

### 3. Dispatch implementer subagent

Launch a general-purpose subagent with:
- The full SKILL.md content as its instructions (do NOT tell it to read the file — paste the content)
- The simulated user request from the test case
- Working directory: the project root or `harness/.output/<skill-name>/` as specified in the test case
- Model: sonnet (mechanical execution)

Wait for the subagent to complete and capture its report.

### 4. Dispatch verifier subagent

Launch a code-reviewer subagent with:
- The full checklist from `harness/checklists/<skill-name>.md`
- The implementer's report for context (but instruct it to read actual files, not trust the report)
- Output directory path from step 3

Wait for the verifier to complete.

### 5. Report results

Present to the user:
- Score: X/Y items passed
- Any FAIL items with details
- Skill improvement suggestions (issues caused by unclear skill guidance)
- If improvements are needed, ask the user if you should apply them to the skill

## Task

Run harness test for: $ARGUMENTS
