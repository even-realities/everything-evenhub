# Skill Harness Testing

Automated quality verification for evenhub-skills. Each skill has a test case that simulates a real developer request, executes via a subagent, and validates the output against a structured checklist.

## How It Works

```
1. Implementer subagent
   - Receives: skill SKILL.md content + simulated user request
   - Executes in isolated directory: harness/.output/<skill-name>/
   - Produces: project files, code, or answers

2. Verifier subagent
   - Receives: verification checklist for the skill
   - Reads actual output files on disk
   - Reports: PASS/FAIL per item + skill improvement suggestions
```

## Running a Test

From Claude Code, in the evenhub-skills directory:

```
/harness quickstart
```

Or manually dispatch:

1. Read `harness/cases/<skill-name>.md` for the test case
2. Dispatch an implementer subagent with the skill content + test prompt
3. Dispatch a verifier subagent with `harness/checklists/<skill-name>.md`
4. Review results and apply any skill improvements

## Directory Structure

```
harness/
  README.md              # This file
  SKILL.md               # Harness runner skill (invokable as /harness)
  cases/                  # Test case definitions (user prompt + context)
    quickstart.md
    ...
  checklists/             # Verification checklists
    quickstart.md
    ...
  .output/                # Generated test output (gitignored)
```

## Adding a New Test

1. Create `harness/cases/<skill-name>.md` with the simulated user request
2. Create `harness/checklists/<skill-name>.md` with the verification checklist
3. Run the test and iterate on the skill until all checks pass

## Success Criteria

- All checklist items PASS
- No FAIL items caused by unclear skill guidance (vs. agent error)
- Skill improvements are committed back to the skill file
